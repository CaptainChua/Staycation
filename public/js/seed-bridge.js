/* ============================================================
   SEED BRIDGE  (loaded first on every page)
   ------------------------------------------------------------
   Makes the existing front-end — which reads/writes localStorage
   synchronously — talk to the shared Node.js backend, with NO
   changes to any page code:

     1. On load, it primes localStorage with the server's current
        values (injected as window.__SEED__) so synchronous reads
        like loadHavens() / JSON.parse(localStorage.getItem(...))
        return the live, shared data.
     2. It wraps localStorage.setItem / removeItem so that writes to
        the shared business keys are mirrored back to the server.

   Per-session keys (current_user, dashboard_page, UI filters, the
   pending/confirmed booking handoff) are left untouched and stay
   in the browser, exactly as before.
   ============================================================ */
(function () {
  "use strict";

  var SHARED = [
    "staycation_havens",
    "shph_settings",
    "shph_bookings_v3",
    "shph_staff_v1",
    "shph_bills_v1",
    "shph_expenses_v1",
    "shph_cleaning_v1",
    "shph_poolpass_v1",
    "shph_guestform_units",
    "shph_employee_nicole",
    "shph_users",
    "shph_activity_log",
    "shph_partners",
    "shph_partner_board"
  ];
  // keys that used to be browser-only: the first time the server copy is still
  // empty, migrate this browser's existing data UP instead of letting the empty
  // server value overwrite (and destroy) it.
  var MIGRATE = ["shph_poolpass_v1", "shph_guestform_units", "shph_employee_nicole", "shph_partners"];
  // id-keyed list stores that MERGE (never overwrite) on load + save → no lost records,
  // multi-user safe. Must match server.js MERGE_LIST_KEYS. (id-less stores must NOT be here.)
  var MERGE_KEYS = ["shph_bookings_v3", "shph_bills_v1", "shph_expenses_v1", "shph_users", "shph_staff_v1", "staycation_havens"];
  var isShared = function (k) { return SHARED.indexOf(k) !== -1; };
  function isEmptyVal(v) {
    return v == null
      || (Array.isArray(v) && v.length === 0)
      || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
  }

  var seed = window.__SEED__ || {};

  // ---- durable write queue ----------------------------------------------
  // Every shared-key write is queued and RE-TRIED until the server confirms it
  // (never gives up). While anything is unsaved, a red banner is shown and the
  // browser warns before the tab is closed — so a payment/booking/etc. can never
  // be silently lost, even on a flaky connection.
  var pending = {};   // key -> latest JSON not yet confirmed saved
  var delay = {};     // key -> current backoff (ms)
  var timer = {};     // key -> retry timer id
  var lastErr = {};   // key -> human reason the last save attempt failed
  var banner = null;

  // Mirror the unconfirmed queue to localStorage so a refresh / crash / closed
  // laptop can't lose an in-flight save: on the next load we replay it and keep
  // retrying. Merge keys (bookings, etc.) are NOT mirrored here — their own
  // localStorage key + prime-merge already recovers them, and copying their
  // base64 images twice would waste storage.
  var PERSIST_KEY = "__shph_unsynced__";
  function persistPending() {
    try {
      var o = {};
      for (var k in pending) {
        if (!pending.hasOwnProperty(k) || pending[k] === undefined) continue;
        if (MERGE_KEYS.indexOf(k) !== -1) continue;   // already durable via its own key
        o[k] = pending[k];
      }
      if (Object.keys(o).length) localStorage.setItem(PERSIST_KEY, JSON.stringify(o));
      else { try { localStorage.removeItem(PERSIST_KEY); } catch (e) {} }
    } catch (e) {}
  }
  var KEY_LABEL = { shph_bookings_v3: "booking/payment", shph_users: "user", shph_partners: "partner", shph_expenses_v1: "expense", shph_bills_v1: "bill" };

  function unsavedCount() { var n = 0; for (var k in pending) if (pending.hasOwnProperty(k)) n++; return n; }

  function updateBanner() {
    var n = unsavedCount();
    try {
      if (n > 0) {
        if (!banner && document.body) {
          banner = document.createElement("div");
          banner.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#c0283d;color:#fff;font:600 13px/1.45 system-ui,Segoe UI,Arial,sans-serif;padding:11px 16px;text-align:center;box-shadow:0 -2px 12px rgba(0,0,0,.25)";
          document.body.appendChild(banner);
        }
        if (banner) {
          var reason = "", what = "";
          for (var k in lastErr) { if (pending[k] !== undefined && lastErr[k]) { reason = lastErr[k]; what = KEY_LABEL[k] || k; break; } }
          banner.textContent = "⚠️ " + n + " " + (what ? what + " " : "") + "change" + (n > 1 ? "s" : "") +
            " not yet saved to the server" + (reason ? " — " + reason : "") +
            ". Keep this tab open & check your internet; it will keep retrying.";
          banner.style.display = "block";
        }
      } else if (banner) { banner.style.display = "none"; }
    } catch (e) {}
  }

  function flush(key) {
    timer[key] = null;
    var body = pending[key];
    if (body === undefined) return;
    fetch("/api/kv/" + encodeURIComponent(key), {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: body
    }).then(function (res) {
      if (res.ok) {
        delete lastErr[key];
        if (pending[key] === body) { delete pending[key]; delete delay[key]; persistPending(); updateBanner(); }
        else { delay[key] = 200; flush(key); }      // a newer value queued meanwhile → save it
      } else {
        lastErr[key] = (res.status === 413 || res.status === 502) ? ("the save is too large (error " + res.status + ")") : ("server error " + res.status);
        try { res.text().then(function (t) { console.error("[sync] save REJECTED for " + key + " — HTTP " + res.status + ": " + String(t || "").slice(0, 300)); }).catch(function () {}); } catch (e) {}
        scheduleRetry(key);                          // 4xx/5xx → try again
      }
    }).catch(function (err) {                          // network/timeout → try again
      lastErr[key] = "can't reach the server (offline or slow connection?)";
      try { console.error("[sync] network error saving " + key + ": " + (err && err.message)); } catch (e) {}
      scheduleRetry(key);
    });
  }

  function scheduleRetry(key) {
    updateBanner();
    delay[key] = Math.min((delay[key] || 600) * 1.7, 30000);   // backoff, capped at 30s
    if (timer[key]) clearTimeout(timer[key]);
    timer[key] = setTimeout(function () { flush(key); }, delay[key]);
  }

  // queue the LATEST value for a key and (re)start flushing — never gives up
  function push(key, jsonString) {
    pending[key] = jsonString;
    persistPending();
    delay[key] = 600;
    if (timer[key]) { clearTimeout(timer[key]); timer[key] = null; }
    flush(key);
  }

  // warn before leaving if something still hasn't saved
  window.addEventListener("beforeunload", function (e) {
    if (unsavedCount() > 0) { e.preventDefault(); e.returnValue = ""; return ""; }
  });

  // 1) prime localStorage from the server so synchronous reads work
  SHARED.forEach(function (k) {
    if (!Object.prototype.hasOwnProperty.call(seed, k)) return;
    var sv = seed[k];
    // one-time migration for former browser-only keys: server still empty but this
    // browser has data → keep the local data and push it up (don't overwrite).
    if (MIGRATE.indexOf(k) !== -1 && isEmptyVal(sv)) {
      var lr = null;
      try { lr = localStorage.getItem(k); } catch (e) {}
      if (lr) {
        var lv = null; try { lv = JSON.parse(lr); } catch (e) {}
        if (!isEmptyVal(lv)) { push(k, lr); return; }   // migrate up, keep local copy
      }
    }
    // Merged list stores: NEVER let the server copy silently drop a record this browser saved
    // but hasn't finished syncing yet (e.g. you clicked Save then refreshed). Merge local +
    // server by id and re-push anything the server is still missing — the durable queue keeps
    // retrying until confirmed. (Soft-deleted records are kept, marked, and hidden by the page.)
    if (MERGE_KEYS.indexOf(k) !== -1) {
      var serverArr = Array.isArray(sv) ? sv : [];
      var localArr = []; try { localArr = JSON.parse(localStorage.getItem(k) || "[]") || []; } catch (e) { localArr = []; }
      var byId = {}, order = [];
      serverArr.forEach(function (b) { if (b && b.id != null && !(String(b.id) in byId)) { byId[String(b.id)] = b; order.push(String(b.id)); } });
      var changed = false;
      localArr.forEach(function (b) {
        if (!b || b.id == null) return;
        var id = String(b.id);
        if (!(id in byId)) { byId[id] = b; order.push(id); changed = true; return; }   // a record only this browser has
        var s = byId[id];
        // both have it → keep the MORE-RECENTLY-EDITED copy, so a local change that hasn't
        // finished syncing (e.g. a deposit marked returned) isn't wiped by the older server
        // copy on refresh. Then re-push it so the server catches up.
        if (b.updatedAt && (!s.updatedAt || String(b.updatedAt) > String(s.updatedAt))) { byId[id] = b; changed = true; }
      });
      var merged = order.map(function (id) { return byId[id]; });
      try { localStorage.setItem(k, JSON.stringify(merged)); } catch (e) {}   // setItem isn't wrapped yet → no push here
      if (changed) push(k, JSON.stringify(merged));   // re-send anything the server is missing or has an older copy of
      return;
    }
    if (sv != null) { try { localStorage.setItem(k, JSON.stringify(sv)); } catch (e) {} }
  });

  var proto = window.Storage && window.Storage.prototype;
  if (proto) {
    var _set = proto.setItem;
    var _remove = proto.removeItem;

    proto.setItem = function (key, value) {
      _set.apply(this, arguments);
      // only mirror the real localStorage (not sessionStorage) and only shared keys
      if (this === window.localStorage && isShared(key)) push(key, String(value));
    };

    proto.removeItem = function (key) {
      _remove.apply(this, arguments);
      if (this === window.localStorage && isShared(key)) {
        try { fetch("/api/kv/" + encodeURIComponent(key), { method: "DELETE" }); } catch (e) {}
      }
    };
  }

  // 3) recover any write that was queued but NOT yet confirmed before the tab was
  //    closed/refreshed/crashed — replay it so it keeps retrying until saved. (Merge
  //    keys like bookings are already recovered by prime-merge above; this covers the
  //    rest — settings, cleaning, pool pass, guest forms, partner board, etc.)
  try {
    var unsynced = JSON.parse(localStorage.getItem(PERSIST_KEY) || "{}") || {};
    Object.keys(unsynced).forEach(function (k) {
      if (!isShared(k) || typeof unsynced[k] !== "string") return;
      try { localStorage.setItem(k, unsynced[k]); } catch (e) {}   // wrapped setItem → restores the local copy AND re-queues the push
    });
  } catch (e) {}

  // 4) the moment the network comes back (or the tab is refocused), stop waiting on the
  //    backoff timer and retry everything still unsaved immediately.
  function flushAll() {
    for (var k in pending) {
      if (!pending.hasOwnProperty(k)) continue;
      delay[k] = 200;
      if (timer[k]) { clearTimeout(timer[k]); timer[k] = null; }
      flush(k);
    }
  }
  try {
    window.addEventListener("online", flushAll);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) flushAll(); });
  } catch (e) {}
})();

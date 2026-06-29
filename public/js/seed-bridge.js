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
  var banner = null;

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
          banner.textContent = "⚠️ " + n + " change" + (n > 1 ? "s" : "") +
            " not yet saved to the server — keep this tab open and check your internet; it will keep retrying.";
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
        if (pending[key] === body) { delete pending[key]; delete delay[key]; updateBanner(); }
        else { delay[key] = 200; flush(key); }      // a newer value queued meanwhile → save it
      } else { scheduleRetry(key); }                 // 4xx/5xx → try again
    }).catch(function () { scheduleRetry(key); });    // network error → try again
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
})();

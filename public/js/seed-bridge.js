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
    "shph_activity_log"
  ];
  // keys that used to be browser-only: the first time the server copy is still
  // empty, migrate this browser's existing data UP instead of letting the empty
  // server value overwrite (and destroy) it.
  var MIGRATE = ["shph_poolpass_v1", "shph_guestform_units", "shph_employee_nicole"];
  var isShared = function (k) { return SHARED.indexOf(k) !== -1; };
  function isEmptyVal(v) {
    return v == null
      || (Array.isArray(v) && v.length === 0)
      || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
  }

  var seed = window.__SEED__ || {};

  // mirror a shared-key write to the server, RETRYING on failure so a transient
  // network/server hiccup can't silently drop a write (e.g. a booking).
  function push(key, jsonString, attempt) {
    attempt = attempt || 1;
    var MAX = 5;
    function retry() {
      if (attempt < MAX) setTimeout(function () { push(key, jsonString, attempt + 1); }, 800 * attempt);
    }
    try {
      fetch("/api/kv/" + encodeURIComponent(key), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: jsonString
      }).then(function (res) { if (!res.ok) retry(); })
        .catch(function () { retry(); });   // network error → try again
    } catch (e) { retry(); }
  }

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

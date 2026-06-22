/* ============================================================
   STAYCATION HAVEN PH — UNIFIED DATA LAYER  (the "backend")
   ------------------------------------------------------------
   Every page talks to DB.*  — NEVER to localStorage directly.

   Today DB is backed by the browser (LocalAdapter). The day you
   go live, set  DB_BACKEND = "firebase"  below and fill in the
   FirebaseAdapter — and every page keeps working unchanged,
   because none of them know (or care) where the data lives.

   The API is ASYNC on purpose (everything returns a Promise) so
   that a real online database is a true drop-in. With the local
   backend the Promises just resolve instantly.

   ----- THE API -----------------------------------------------
   Lists (bookings, havens, staff, bills, cleaning, users):
     DB.bookings.list()              -> Promise<Array>
     DB.bookings.get(id)             -> Promise<Object|null>
     DB.bookings.add(obj)            -> Promise<Object>   (returns it WITH an id)
     DB.bookings.update(id, patch)   -> Promise<Object>
     DB.bookings.remove(id)          -> Promise<void>
     DB.bookings.set(arrayOfAll)     -> Promise<void>     (replace the whole list)
     DB.bookings.subscribe(fn)       -> unsubscribe fn    (fn(list) on every change)

   Single documents (settings):
     DB.settings.get()               -> Promise<Object>
     DB.settings.set(obj)            -> Promise<Object>
     DB.settings.subscribe(fn)       -> unsubscribe fn
   ============================================================ */

(function (global) {
  "use strict";

  // ---- 1. CHOOSE THE BACKEND -------------------------------
  // "local"    = browser localStorage (per-device, what you have now)
  // "firebase" = shared online database (flip this when you go live)
  const DB_BACKEND = "local";

  // ---- 2. DECLARE YOUR DATA --------------------------------
  // "list" = a collection of records (each gets an id)
  // "doc"  = one single blob of settings
  const COLLECTIONS = {
    bookings: { key: "shph_bookings_v3",  type: "list" },
    havens:   { key: "staycation_havens", type: "list" },
    settings: { key: "shph_settings",     type: "doc"  },
    staff:    { key: "shph_staff_v1",     type: "list" },
    bills:    { key: "shph_bills_v1",     type: "list" },
    cleaning: { key: "shph_cleaning_v1",  type: "list" },
    users:    { key: "shph_users",        type: "list" }
  };

  // ---- helpers ---------------------------------------------
  let _idSeed = 0;
  function newId() {
    // time-ordered, collision-resistant id that works offline too.
    // (Date.now is fine in the browser; only the build sandbox forbids it.)
    const t = (typeof Date !== "undefined" && Date.now) ? Date.now() : 0;
    _idSeed = (_idSeed + 1) % 100000;
    return "id_" + t.toString(36) + "_" + _idSeed.toString(36);
  }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

  /* ============================================================
     ADAPTER A — LOCAL (browser)  ✅ in use now
     A tiny pub/sub gives same-tab live updates; the native
     "storage" event gives cross-tab updates. When you swap to
     Firebase, subscribe() becomes a real cross-DEVICE feed.
     ============================================================ */
  function LocalAdapter() {
    const subs = {}; // name -> Set(fn)

    function rawRead(name) {
      const cfg = COLLECTIONS[name];
      try {
        const v = JSON.parse(localStorage.getItem(cfg.key));
        if (v != null) return v;
      } catch (e) {}
      return cfg.type === "list" ? [] : {};
    }
    function rawWrite(name, value) {
      const cfg = COLLECTIONS[name];
      localStorage.setItem(cfg.key, JSON.stringify(value));
      emit(name, value);
    }
    function emit(name, value) {
      const set = subs[name];
      if (set) set.forEach(fn => { try { fn(clone(value)); } catch (e) {} });
    }

    // keep tabs in sync: when another tab writes, tell our subscribers
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("storage", function (e) {
        for (const name in COLLECTIONS) {
          if (COLLECTIONS[name].key === e.key) emit(name, rawRead(name));
        }
      });
    }

    return {
      // lists
      list:   (name)        => Promise.resolve(clone(rawRead(name))),
      get:    (name, id)    => Promise.resolve(clone(rawRead(name).find(r => String(r.id) === String(id)) || null)),
      add:    (name, obj)   => {
        const list = rawRead(name);
        const rec = Object.assign({}, obj);
        if (rec.id == null) rec.id = newId();
        list.push(rec);
        rawWrite(name, list);
        return Promise.resolve(clone(rec));
      },
      update: (name, id, patch) => {
        const list = rawRead(name);
        const i = list.findIndex(r => String(r.id) === String(id));
        if (i < 0) return Promise.reject(new Error(name + " id not found: " + id));
        list[i] = Object.assign({}, list[i], patch, { id: list[i].id });
        rawWrite(name, list);
        return Promise.resolve(clone(list[i]));
      },
      remove: (name, id) => {
        const list = rawRead(name).filter(r => String(r.id) !== String(id));
        rawWrite(name, list);
        return Promise.resolve();
      },
      setAll: (name, arr) => { rawWrite(name, arr); return Promise.resolve(); },
      // docs
      getDoc: (name)      => Promise.resolve(clone(rawRead(name))),
      setDoc: (name, obj) => { rawWrite(name, obj); return Promise.resolve(clone(obj)); },
      // realtime
      subscribe: (name, fn) => {
        (subs[name] || (subs[name] = new Set())).add(fn);
        // fire once with current value so the caller can render immediately
        Promise.resolve().then(() => fn(clone(rawRead(name))));
        return () => subs[name] && subs[name].delete(fn);
      }
    };
  }

  /* ============================================================
     ADAPTER B — FIREBASE (online)  🔜 fill in when you go live
     The shape mirrors LocalAdapter exactly, so DB.* never changes.
     Leave this stub until you create your Firebase project; then
     uncomment, paste your config, and set DB_BACKEND = "firebase".
     ------------------------------------------------------------
     // import in your HTML (modular SDK v10+):
     //   <script type="module"> ... </script>
     // or load compat build and use the namespaced API below.

     function FirebaseAdapter() {
       // const app = firebase.initializeApp(firebaseConfig);
       // const fs  = firebase.firestore();
       return {
         list:   (name) => fs.collection(name).get()
                    .then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
         get:    (name, id) => fs.collection(name).doc(String(id)).get()
                    .then(d => d.exists ? ({ id: d.id, ...d.data() }) : null),
         add:    (name, obj) => { const ref = fs.collection(name).doc();
                    return ref.set({ ...obj }).then(() => ({ id: ref.id, ...obj })); },
         update: (name, id, patch) => fs.collection(name).doc(String(id)).update(patch)
                    .then(() => DB._raw.get(name, id)),
         remove: (name, id) => fs.collection(name).doc(String(id)).delete(),
         setAll: (name, arr) => {  // batch overwrite
                    const batch = fs.batch();
                    arr.forEach(r => batch.set(fs.collection(name).doc(String(r.id || '')), r));
                    return batch.commit(); },
         getDoc: (name) => fs.collection("_docs").doc(name).get()
                    .then(d => d.exists ? d.data() : {}),
         setDoc: (name, obj) => fs.collection("_docs").doc(name).set(obj).then(() => obj),
         subscribe: (name, fn) => fs.collection(name).onSnapshot(s =>
                    fn(s.docs.map(d => ({ id: d.id, ...d.data() })))),
       };
     }
     ============================================================ */

  // ---- 3. WIRE THE CHOSEN ADAPTER --------------------------
  const adapter =
    DB_BACKEND === "firebase" /* && typeof FirebaseAdapter==="function" */
      ? (function () { throw new Error("FirebaseAdapter not configured yet — see db.js"); })()
      : LocalAdapter();

  // ---- 4. BUILD THE PUBLIC DB.* SURFACE --------------------
  const DB = { backend: DB_BACKEND, _raw: adapter };

  for (const name in COLLECTIONS) {
    if (COLLECTIONS[name].type === "list") {
      DB[name] = {
        list:      ()           => adapter.list(name),
        get:       (id)         => adapter.get(name, id),
        add:       (obj)        => adapter.add(name, obj),
        update:    (id, patch)  => adapter.update(name, id, patch),
        remove:    (id)         => adapter.remove(name, id),
        set:       (arr)        => adapter.setAll(name, arr),
        subscribe: (fn)         => adapter.subscribe(name, fn)
      };
    } else {
      DB[name] = {
        get:       ()    => adapter.getDoc(name),
        set:       (obj) => adapter.setDoc(name, obj),
        subscribe: (fn)  => adapter.subscribe(name, fn)
      };
    }
  }

  global.DB = DB;
})(typeof window !== "undefined" ? window : this);

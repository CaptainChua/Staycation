/* ============================================================
   STAYCATION HAVEN PH — SERVER-SIDE DATA STORE
   ------------------------------------------------------------
   A small key/value store with TWO interchangeable backends:

     • Firebase Firestore  — used when a service-account key is
       available (cloud, shared across devices, survives deploys).
     • Local JSON file      — used otherwise (data/store.json), so
       the app keeps working with zero setup.

   Either way the rest of the app is unchanged: it mirrors the
   localStorage keys the front-end already uses. An in-memory cache
   keeps get()/all() synchronous; writes go through to the backend.

   To use Firestore: put your Firebase service-account JSON at
   ./serviceAccountKey.json (git-ignored), or set the
   FIREBASE_SERVICE_ACCOUNT env var to its JSON contents.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const KEY_FILE = path.join(__dirname, "..", "serviceAccountKey.json");
const FS_COLLECTION = "shph_store";   // one document per shared key
const IMG_COLLECTION = "shph_images"; // one document per offloaded base64 image
const IMG_PREFIX = "shphimg::";       // marker that replaces a base64 image with its image-doc id
const IMG_MAX_BYTES = 1040000;        // safety: stay just under Firestore's 1MB per-document limit

/* ---- Defaults (same values the old browser scripts shipped) ---- */
const DEFAULT_HAVENS = [
  {
    id: 1,
    name: "Haven 1",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
    gallery: [],
    price: "₱2,500 / night",
    description: "Perfect for couples and small families.",
    amenities: ["📶 Fast WiFi", "📺 Netflix", "❄️ Air Conditioning", "🛏️ Comfortable Beds"]
  },
  {
    id: 2,
    name: "Haven 2",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    gallery: [],
    price: "₱3,200 / night",
    description: "Modern city-view staycation.",
    amenities: ["📶 Fast WiFi", "📺 Netflix", "🚗 Parking", "🍳 Kitchen"]
  },
  {
    id: 3,
    name: "Casa Bienca",
    image: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200",
    gallery: [],
    price: "₱5,000 / night",
    description: "Luxury experience with premium amenities.",
    amenities: ["📶 Fast WiFi", "📺 Netflix", "❄️ Air Conditioning", "🚗 Parking", "🍳 Kitchen", "🛏️ Comfortable Beds"]
  }
];

const DEFAULT_SETTINGS = {
  pricing: {
    stay6: 999, stay10: 1599, stay21Weekday: 1799, stay21Weekend: 2099,
    longWeekday: 1699, longWeekend: 1899, holidayNight: 2099, holidayDayUse: 1799,
    deposit: 1000, includedPax: 2, addPax: 300, poolRegular: 150, poolHoliday: 300,
    extraHour: 150, towelRate: 50, towelMaxPerPax: 2, maxDays: 14,
    offer6: true, offer10: true, offer21: true
  },
  customAddons: [],
  promos: [],
  downpayment: [
    { maxDays: 2, amount: 500 },
    { maxDays: 4, amount: 1000 },
    { maxDays: 8, amount: 2000 },
    { maxDays: 14, amount: 4000 }
  ],
  payment: {
    intro: "Kindly send your payment here po 😊",
    screenshotNote: "PLEASE SEND A SCREENSHOT AFTER PAYMENT PO.",
    warnNote: "Please be noted po: no payment = no reservation. Thank you ❤️",
    cashNote: "Please prepare the downpayment in cash upon check-in.",
    methods: [
      { name: "GCash", number: "0945 693 5211", account: "Pia Carla Salamat", qr: "" },
      { name: "Maya", number: "0945 693 5211", account: "Pia Carla Salamat", qr: "" },
      { name: "BDO", number: "010940093073", account: "Pia Carla Salamat", qr: "" }
    ]
  }
};

// The shared business keys that live on the server. Per-session keys
// (current_user, dashboard_page, the pending/confirmed booking handoff,
// UI filters) stay in the browser and are NOT listed here.
const SHARED_KEYS = [
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
  "shph_partner_board",
  "shph_deleted_bookings"
];

function defaults() {
  return {
    staycation_havens: DEFAULT_HAVENS,
    shph_settings: DEFAULT_SETTINGS,
    shph_bookings_v3: [],
    shph_staff_v1: [],
    shph_bills_v1: [],
    shph_expenses_v1: [],
    shph_cleaning_v1: [],
    shph_poolpass_v1: [],
    shph_guestform_units: {},
    shph_employee_nicole: {},
    shph_users: [],
    shph_activity_log: [],
    shph_partners: [],
    shph_partner_board: {},
    shph_deleted_bookings: []
  };
}

let cache = null;     // in-memory mirror of every shared key (with images inlined)
let backend = "file"; // "file" | "firestore"
let db = null;        // Firestore instance (when backend === "firestore")
let initPromise = null;
let imageCache = {};  // id → base64 data-url (file backend / legacy only)
let bucket = null;            // Firebase Cloud Storage bucket (when available)
let knownImageIds = new Set();// ids already uploaded this process (dedupe)
const IMG_DIR = "shph-images";// folder inside the Storage bucket
const STORAGE_BUCKET_ENV = process.env.FIREBASE_STORAGE_BUCKET || "";

/* ----------------------- Firebase credentials ----------------------- */
// Returns a parsed service-account object, or null if none is configured.
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try { return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); }
    catch (e) { console.warn("[store] FIREBASE_SERVICE_ACCOUNT is not valid JSON — ignoring."); }
  }
  if (fs.existsSync(KEY_FILE)) {
    try { return JSON.parse(fs.readFileSync(KEY_FILE, "utf8")); }
    catch (e) { console.warn("[store] serviceAccountKey.json is not valid JSON — ignoring."); }
  }
  return null;
}

/* --------------------------- File backend --------------------------- */
function fileLoad() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return null;
  }
}

function filePersist() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), "utf8");
    fs.renameSync(tmp, DATA_FILE); // atomic-ish swap
  } catch (e) {
    // Serverless filesystems (e.g. Vercel) are read-only, so writing throws
    // ENOENT/EROFS. Don't crash the request — keep serving from the in-memory
    // cache. (Durable persistence there comes from the Firestore backend.)
    console.warn("[store] file persist skipped (read-only filesystem?):", e.message);
  }
}

/* --------------------- Image offload (Firestore) -------------------- */
// Base64 images (payment proofs, IDs, QR codes…) are huge and would push a
// shared document past Firestore's 1MB limit. So we store each image in its
// own document (collection IMG_COLLECTION) and leave only a tiny "shphimg::<id>"
// reference inside the shared document. On read we swap the references back to
// the real image, so the rest of the app never notices.
function isDataUrl(s) {
  return typeof s === "string" && s.startsWith("data:") && s.indexOf(";base64,") !== -1;
}
function imageId(dataUrl) {
  return crypto.createHash("sha1").update(dataUrl).digest("hex");
}
// deep clone, applying fn() to every string
function mapStrings(v, fn) {
  if (typeof v === "string") return fn(v);
  if (Array.isArray(v)) return v.map(x => mapStrings(x, fn));
  if (v && typeof v === "object") {
    const out = {};
    for (const k in v) out[k] = mapStrings(v[k], fn);
    return out;
  }
  return v;
}
// returns { clean, images } — clean has refs, images is { id: dataUrl } of new ones
function extractImages(value) {
  const images = {};
  const clean = mapStrings(value, s => {
    if (!isDataUrl(s)) return s;
    const id = imageId(s);
    images[id] = s;
    return IMG_PREFIX + id;
  });
  return { clean, images };
}
// returns a copy of value with every "shphimg::<id>" reference rewritten to a
// tiny on-demand URL (/img/<id>) that the server streams from Cloud Storage (or
// the legacy Firestore image doc). Keeps the payload small — no inline base64.
function inlineImages(value) {
  return mapStrings(value, s => {
    if (typeof s === "string" && s.startsWith(IMG_PREFIX)) {
      return "/img/" + s.slice(IMG_PREFIX.length);
    }
    return s;
  });
}

/* ----------------------- Cloud Storage images ---------------------- */
// split a "data:<mime>;base64,<data>" string into a Buffer + content type
function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl || "");
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], "base64") };
}
// upload one image to the Storage bucket at shph-images/<id> (no 1MB limit),
// retrying a few times so a transient hiccup doesn't drop the photo.
async function uploadImage(id, dataUrl, attempt) {
  attempt = attempt || 1;
  const p = parseDataUrl(dataUrl);
  if (!p) throw new Error("not a base64 data URL");
  try {
    await bucket.file(IMG_DIR + "/" + id).save(p.buffer, {
      resumable: false,
      contentType: p.contentType,
      metadata: { cacheControl: "public, max-age=31536000, immutable" }
    });
  } catch (e) {
    if (attempt < 3) { await new Promise(r => setTimeout(r, 500 * attempt)); return uploadImage(id, dataUrl, attempt + 1); }
    throw e;   // give up after retries → propagates so the whole save retries
  }
}
// fetch one image by id for the GET /img/:id endpoint — Storage first, then the
// legacy Firestore image doc (so photos saved before the migration still work).
async function getImage(id) {
  if (bucket) {
    try {
      const file = bucket.file(IMG_DIR + "/" + id);
      const [exists] = await file.exists();
      if (exists) {
        const [meta] = await file.getMetadata();
        const [buf] = await file.download();
        return { buffer: buf, contentType: meta.contentType || "application/octet-stream" };
      }
    } catch (e) { /* fall through to legacy */ }
  }
  if (db) {
    try {
      const doc = await db.collection(IMG_COLLECTION).doc(id).get();
      if (doc.exists) {
        const p = parseDataUrl(doc.data().data);
        if (p) return { buffer: p.buffer, contentType: p.contentType };
      }
    } catch (e) { /* not found */ }
  }
  return null;
}

/* ------------------------ Firestore backend ------------------------ */
// Each shared key is one document { json: "<stringified value>" }. Storing
// the value as a JSON string sidesteps Firestore's type limits (e.g. it
// rejects nested arrays, which booking "lines" use) and keeps round-trips
// loss-free. Read = JSON.parse, write = JSON.stringify.
async function firestoreHydrate() {
  const d = defaults();
  // load the shared docs (image refs are rewritten to /img/<id> URLs, served on
  // demand) — no more pulling every base64 image into memory / into the payload.
  const col = db.collection(FS_COLLECTION);
  const out = {};
  const snap = await col.get();
  const found = {};
  snap.forEach(doc => {
    try { found[doc.id] = JSON.parse(doc.data().json); }
    catch (e) { /* skip corrupt doc, default will fill in */ }
  });
  const writes = [];
  for (const k of SHARED_KEYS) {
    if (k in found) {
      out[k] = inlineImages(found[k]);             // shphimg::<id> → /img/<id>
    } else {
      out[k] = d[k];                               // seed any missing key
      writes.push(col.doc(k).set({ json: JSON.stringify(d[k]) }));
    }
  }
  if (writes.length) await Promise.all(writes);
  return out;
}

// offload any new base64 images (to Cloud Storage if available, else the legacy
// Firestore image docs), then store the shared doc which holds only tiny refs.
async function firestorePersistKey(key) {
  const { clean, images } = extractImages(cache[key]);
  const writes = [];
  for (const id in images) {
    if (knownImageIds.has(id)) continue;                 // already uploaded this process
    const dataUrl = images[id];
    if (bucket) {
      // Cloud Storage — no size limit, uses the bucket you purchased. A failure
      // PROPAGATES (no .catch) so the whole save is reported as failed and the
      // client keeps retrying — the photo is never silently dropped.
      writes.push(uploadImage(id, dataUrl).then(() => knownImageIds.add(id)));
    } else {
      // fallback: legacy Firestore base64 doc (still capped at 1MB)
      if (Buffer.byteLength(dataUrl) > IMG_MAX_BYTES) {
        throw new Error(`image ${id} exceeds 1MB and no Storage bucket configured`);
      }
      writes.push(
        db.collection(IMG_COLLECTION).doc(id).set({ data: dataUrl }).then(() => knownImageIds.add(id))
      );
    }
  }
  if (writes.length) await Promise.all(writes);
  return db.collection(FS_COLLECTION).doc(key).set({ json: JSON.stringify(clean) });
}

function firestoreDeleteKey(key) {
  return db.collection(FS_COLLECTION).doc(key).delete();
}

// merge two id-keyed lists: last write wins per id, but NEVER un-delete a soft-deleted record
function mergeById(stored, incoming) {
  const byId = new Map();
  for (const b of stored) if (b && b.id != null) byId.set(String(b.id), b);
  for (const b of incoming) {
    if (!b || b.id == null) continue;
    const cur = byId.get(String(b.id));
    if (cur) {
      if (cur.deleted && !b.deleted) continue;            // never un-delete a tombstoned record
      // keep the most-recently-EDITED record, not just the last to arrive: a stale client
      // that re-saves an old copy can't clobber a newer edit made elsewhere.
      if (cur.updatedAt && b.updatedAt && String(b.updatedAt) < String(cur.updatedAt)) continue;
    }
    byId.set(String(b.id), b);
  }
  return Array.from(byId.values());
}

// ATOMIC per-item merge write for id-keyed list stores. On Firestore it reads the LIVE
// document inside a transaction (NOT the possibly-stale in-memory cache), merges the
// incoming items by id, and writes — so two concurrent saves (different users, server
// instances, or during a deploy) can never overwrite each other or drop a record.
async function mergeListWrite(key, incoming) {
  if (!Array.isArray(incoming)) {                       // not a list → normal durable write
    ensureLoaded()[key] = incoming;
    if (backend === "firestore") await firestorePersistKey(key); else filePersist();
    return;
  }
  if (backend !== "firestore") {                        // file backend: single process, no concurrency
    const cur = ensureLoaded()[key];
    cache[key] = mergeById(Array.isArray(cur) ? cur : [], incoming);
    filePersist();
    return;
  }
  // 1) upload any NEW base64 images first (outside the txn) so the doc holds only tiny refs
  const { clean: incomingClean, images } = extractImages(incoming);
  const imgWrites = [];
  for (const id in images) {
    if (knownImageIds.has(id)) continue;
    const dataUrl = images[id];
    if (bucket) {
      imgWrites.push(uploadImage(id, dataUrl).then(() => knownImageIds.add(id)));
    } else {
      if (Buffer.byteLength(dataUrl) > IMG_MAX_BYTES) throw new Error(`image ${id} exceeds 1MB and no Storage bucket configured`);
      imgWrites.push(db.collection(IMG_COLLECTION).doc(id).set({ data: dataUrl }).then(() => knownImageIds.add(id)));
    }
  }
  if (imgWrites.length) await Promise.all(imgWrites);
  // 2) atomic read-merge-write against the LIVE doc
  const ref = db.collection(FS_COLLECTION).doc(key);
  let merged = [];
  await db.runTransaction(async (txn) => {
    const snap = await txn.get(ref);
    let stored = [];
    if (snap.exists) { try { stored = JSON.parse(snap.data().json) || []; } catch (e) { stored = []; } }
    merged = mergeById(stored, incomingClean);
    txn.set(ref, { json: JSON.stringify(merged) });
  });
  // 3) refresh the cache with the authoritative result (refs → /img/ urls)
  if (cache) cache[key] = inlineImages(merged);
}

// ATOMIC single-record change in an id-keyed list (cancel/reinstate/delete a booking).
// Reads the LIVE doc in a transaction so it never overwrites the whole list from a stale
// cache. Returns true if the record was found and changed.
async function updateOneFresh(key, id, mutate) {
  if (backend !== "firestore") {
    const arr = ensureLoaded()[key] || [];
    const idx = arr.findIndex(x => String(x.id) === String(id));
    if (idx < 0) return false;
    mutate(arr[idx]);
    arr[idx].updatedAt = new Date().toISOString();   // mark edit time so a stale save can't clobber it
    filePersist();
    return true;
  }
  const ref = db.collection(FS_COLLECTION).doc(key);
  let found = false, merged = [];
  await db.runTransaction(async (txn) => {
    const snap = await txn.get(ref);
    let arr = [];
    if (snap.exists) { try { arr = JSON.parse(snap.data().json) || []; } catch (e) { arr = []; } }
    const idx = arr.findIndex(x => String(x.id) === String(id));
    merged = arr;
    if (idx < 0) { found = false; return; }
    mutate(arr[idx]);
    arr[idx].updatedAt = new Date().toISOString();   // mark edit time so a stale save can't clobber it
    found = true;
    txn.set(ref, { json: JSON.stringify(arr) });
  });
  if (found && cache) cache[key] = inlineImages(merged);
  return found;
}

/* ----------------------------- Lifecycle ---------------------------- */
// Loads the active backend into the in-memory cache. Call once at startup
// and await it before serving requests. Safe to call multiple times.
function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const account = loadServiceAccount();
    if (account) {
      try {
        const { initializeApp, cert, getApps } = require("firebase-admin/app");
        const { getFirestore } = require("firebase-admin/firestore");
        if (!getApps().length) {
          initializeApp({ credential: cert(account) });
        }
        db = getFirestore();
        // resolve a Cloud Storage bucket for images (auto-detect the name).
        try {
          const { getStorage } = require("firebase-admin/storage");
          const pid = account.project_id;
          const candidates = [STORAGE_BUCKET_ENV, pid + ".firebasestorage.app", pid + ".appspot.com"].filter(Boolean);
          for (const name of candidates) {
            try {
              const b = getStorage().bucket(name);
              const [exists] = await b.exists();
              if (exists) { bucket = b; console.log(`[store] image storage: gs://${name}`); break; }
            } catch (e) { /* try next candidate */ }
          }
          if (!bucket) console.warn("[store] no Storage bucket found — images fall back to Firestore (1MB cap). Set FIREBASE_STORAGE_BUCKET to override.");
        } catch (e) { console.warn("[store] Storage init skipped:", e.message); }
        cache = await firestoreHydrate();
        backend = "firestore";
        console.log(`[store] backend: Firestore (project ${account.project_id})`);
        return;
      } catch (e) {
        console.error("[store] Firestore init failed, falling back to JSON file:", e.message);
      }
    }
    // ---- File backend (default) ----
    backend = "file";
    cache = fileLoad() || defaults();
    const d = defaults();
    let changed = false;
    for (const k of SHARED_KEYS) {
      if (!(k in cache)) { cache[k] = d[k]; changed = true; }
    }
    if (!fileLoad() || changed) filePersist();
    console.log("[store] backend: local JSON file (data/store.json)");
  })();
  return initPromise;
}

// Lazy fallback so direct get()/all() still work if init() was never awaited
// (file backend only — Firestore must be initialised via init()).
function ensureLoaded() {
  if (cache) return cache;
  backend = "file";
  cache = fileLoad() || defaults();
  const d = defaults();
  for (const k of SHARED_KEYS) if (!(k in cache)) cache[k] = d[k];
  filePersist();
  return cache;
}

// Write one key through to the active backend. Returns a promise.
function persistKey(key) {
  if (backend === "firestore") {
    return firestorePersistKey(key).catch(e =>
      console.error(`[store] Firestore write failed for "${key}":`, e.message));
  }
  filePersist();
  return Promise.resolve();
}

module.exports = {
  SHARED_KEYS,
  FS_COLLECTION,
  IMG_COLLECTION,
  IMG_MAX_BYTES,
  extractImages,   // exported so the one-time migration reuses the exact same logic
  inlineImages,
  getImage,        // GET /img/:id streams the bytes (Storage, or legacy Firestore)
  init,
  backend: () => backend,
  imageStorage: () => !!bucket,   // true when Cloud Storage is active for images
  isShared: (key) => SHARED_KEYS.includes(key),
  // return every shared key/value (used to seed each page)
  all() {
    const c = ensureLoaded();
    const out = {};
    for (const k of SHARED_KEYS) out[k] = c[k];
    return out;
  },
  get(key) {
    return ensureLoaded()[key];
  },
  // update the cache synchronously, then write through. Returns a promise
  // callers may await for durability.
  set(key, value) {
    ensureLoaded()[key] = value;
    return persistKey(key);
  },
  // Like set(), but DURABLE: it rejects if the backend write fails instead of
  // swallowing the error. Use for data that must never be silently lost (users),
  // so the API can return an error and the client can retry / warn the user.
  async setStrict(key, value) {
    ensureLoaded()[key] = value;
    if (backend === "firestore") {
      await firestorePersistKey(key);   // no .catch → a Firestore failure propagates
    } else {
      filePersist();
    }
  },
  mergeListWrite,   // atomic per-item merge write for id-keyed lists (multi-user safe)
  updateOneFresh,   // atomic single-record change (cancel/reinstate/delete) — fresh, transactional
  remove(key) {
    delete ensureLoaded()[key];
    if (backend === "firestore") {
      return firestoreDeleteKey(key).catch(e =>
        console.error(`[store] Firestore delete failed for "${key}":`, e.message));
    }
    filePersist();
    return Promise.resolve();
  }
};

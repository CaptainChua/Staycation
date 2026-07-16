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
const BACKUP_COLLECTION = "shph_backups"; // rolling restore points: one doc per key per day
const BACKUP_RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS) || 30; // auto-prune older restore points
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
  "shph_deleted_bookings",
  "shph_visits"
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
    shph_deleted_bookings: [],
    shph_visits: { total: 0, days: {} }
  };
}

let cache = null;     // in-memory mirror of every shared key (with images inlined)
let backend = "file"; // "file" | "firestore"
let projectId = null; // Firebase project id (when backend === "firestore") — for the health page
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
// store ONE base64 image and return its id, so the browser can offload a photo the moment
// it's attached and keep the booking payload tiny (instead of pushing the whole list with
// every image inline, which overflows the host's request-size limit). Returns null on the
// file backend (no offload there) so the caller just keeps the inline base64.
async function putImage(dataUrl) {
  if (!isDataUrl(dataUrl)) return null;
  if (backend !== "firestore") return null;
  const id = imageId(dataUrl);
  if (knownImageIds.has(id)) return id;          // already uploaded this process → reuse
  if (bucket) {
    await uploadImage(id, dataUrl);
  } else {
    if (Buffer.byteLength(dataUrl) > IMG_MAX_BYTES) throw new Error("image exceeds 1MB and no Storage bucket configured");
    await db.collection(IMG_COLLECTION).doc(id).set({ data: dataUrl });
  }
  knownImageIds.add(id);
  return id;
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
    catch (e) { /* unreadable doc → leave it ALONE (see below); never overwrite it */ }
  });
  for (const k of SHARED_KEYS) {
    out[k] = (k in found) ? inlineImages(found[k]) : d[k];   // missing/unreadable → in-memory default only
  }
  // IMPORTANT: hydrate NEVER writes to Firestore. The old code seeded empty defaults for any key
  // it couldn't read and WROTE them back — so a transiently unreadable/missing bookings doc on a
  // cold start would be overwritten with [], wiping everything "a few hours later" when a new
  // serverless instance spun up. Missing keys are created by the first real save instead.
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
      // keep the most-recently-EDITED record. A record WITH an updatedAt stamp is newer than
      // one without — so an un-stamped (or older) stale client can't clobber a newer edit made
      // elsewhere (e.g. a deposit marked returned).
      if (cur.updatedAt && (!b.updatedAt || String(b.updatedAt) < String(cur.updatedAt))) continue;
    }
    byId.set(String(b.id), b);
  }
  return Array.from(byId.values());
}

// Rolling SAFETY BACKUP: after a successful bookings write, save the result to a dated doc in a
// separate "shph_backups" collection. Never backs up an empty list and never lets a backup
// shrink — so even an unknown future bug is recoverable. Best-effort: a failure never breaks the
// real write.
async function backupList(key, merged) {
  try {
    if (backend !== "firestore") return;
    if (key !== "shph_bookings_v3") return;                       // only the critical store, for now
    if (!Array.isArray(merged) || merged.length === 0) return;    // never back up an empty list
    const day = new Date().toISOString().slice(0, 10);            // one rolling restore point per day
    const ref = db.collection(BACKUP_COLLECTION).doc(key + "_" + day);
    const snap = await ref.get();
    if (snap.exists && (snap.data().count || 0) > merged.length) return;   // don't let a backup shrink
    await ref.set({ json: JSON.stringify(merged), count: merged.length, at: new Date().toISOString() });
  } catch (e) { console.warn("[store] backup skipped:", e.message); }
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
  await backupList(key, merged);   // best-effort rolling backup
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
  if (found) await backupList(key, merged);   // best-effort rolling backup
  return found;
}

// Read ONE shared key straight from Firestore (not the possibly-stale per-instance cache), image
// refs inlined. Used where a warm instance must NOT serve stale data — e.g. the website maintenance
// flag, which has to take effect the moment the owner flips it. Falls back to the cache on any error.
async function readFreshKey(key) {
  if (backend !== "firestore") return ensureLoaded()[key];
  try {
    const snap = await db.collection(FS_COLLECTION).doc(key).get();
    if (snap.exists) return inlineImages(JSON.parse(snap.data().json));
  } catch (e) { /* fall back to cache */ }
  return ensureLoaded()[key];
}

// Read the LIVE id-keyed list straight from Firestore (not the possibly-stale in-memory cache of
// this serverless instance), image refs inlined to /img urls. Used when the client must see the
// current truth (e.g. a booking's saved guest IDs) before editing, so a stale browser can't hide
// or overwrite saved data.
async function readFreshList(key) {
  if (backend !== "firestore") return ensureLoaded()[key] || [];
  const snap = await db.collection(FS_COLLECTION).doc(key).get();
  let arr = [];
  if (snap.exists) { try { arr = JSON.parse(snap.data().json) || []; } catch (e) { arr = []; } }
  return inlineImages(arr);
}

// ATOMIC insert-or-replace of ONE item (by id) in an id-keyed list. Reads the LIVE doc in a
// transaction, so adding/editing one expense/bill can never overwrite the rest. Any base64
// images in the item (e.g. an expense receipt) are offloaded to refs first.
async function upsertOne(key, item) {
  if (!item || item.id == null) throw new Error("upsertOne needs an item with an id");
  if (backend !== "firestore") {
    const arr = ensureLoaded()[key] || [];
    item.updatedAt = new Date().toISOString();
    const idx = arr.findIndex(x => String(x.id) === String(item.id));
    if (idx >= 0) arr[idx] = item; else arr.push(item);
    cache[key] = arr; filePersist(); return;
  }
  // offload any base64 images in the item first (so the stored doc holds only tiny refs)
  const { clean, images } = extractImages(item);
  const imgWrites = [];
  for (const id in images) {
    if (knownImageIds.has(id)) continue;
    const dataUrl = images[id];
    if (bucket) imgWrites.push(uploadImage(id, dataUrl).then(() => knownImageIds.add(id)));
    else {
      if (Buffer.byteLength(dataUrl) > IMG_MAX_BYTES) throw new Error(`image ${id} exceeds 1MB and no Storage bucket configured`);
      imgWrites.push(db.collection(IMG_COLLECTION).doc(id).set({ data: dataUrl }).then(() => knownImageIds.add(id)));
    }
  }
  if (imgWrites.length) await Promise.all(imgWrites);
  clean.updatedAt = new Date().toISOString();
  const ref = db.collection(FS_COLLECTION).doc(key);
  let merged = [];
  await db.runTransaction(async (txn) => {
    const snap = await txn.get(ref);
    let arr = [];
    if (snap.exists) { try { arr = JSON.parse(snap.data().json) || []; } catch (e) { arr = []; } }
    const idx = arr.findIndex(x => String(x.id) === String(clean.id));
    if (idx >= 0) arr[idx] = clean; else arr.push(clean);
    merged = arr;
    txn.set(ref, { json: JSON.stringify(arr) });
  });
  if (cache) cache[key] = inlineImages(merged);
}

/* ------------------------- Full daily backup ------------------------ */
// Philippine calendar day (UTC+8) as YYYY-MM-DD — matches how the rest of the app dates things.
function phDay() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

// Read the RAW stored value of a shared key straight from Firestore, with image references
// (shphimg::<id>) left INTACT — so a backup round-trips loss-free (restore writes the exact
// refs back, and the images themselves already live durably in Cloud Storage). Falls back to
// the (image-inlined) cache when there is no Firestore backend.
async function readRawKey(key) {
  if (backend !== "firestore") return ensureLoaded()[key];
  try {
    const snap = await db.collection(FS_COLLECTION).doc(key).get();
    if (snap.exists) return JSON.parse(snap.data().json);
  } catch (e) { /* fall back to cache */ }
  return ensureLoaded()[key];
}

// FULL backup of EVERY shared key → one dated doc per key in shph_backups. Runs daily (Vercel
// cron) so a restore point exists even on a day nobody edited anything. Guards, per key:
//   • never back up an EMPTY list over an existing good one, and
//   • never let a list backup SHRINK within the same day.
// Then prunes restore points older than BACKUP_RETENTION_DAYS. Best-effort per key: one key
// failing never aborts the rest. Returns a summary.
async function backupAll() {
  if (backend !== "firestore") return { ok: false, error: "no-firestore-backend" };
  const day = phDay();
  const col = db.collection(BACKUP_COLLECTION);
  const result = { ok: true, day, keys: {}, pruned: 0 };
  for (const key of SHARED_KEYS) {
    try {
      const value = await readRawKey(key);
      const isList = Array.isArray(value);
      const count = isList ? value.length
        : (value && typeof value === "object" ? Object.keys(value).length : (value != null ? 1 : 0));
      if (isList && count === 0) { result.keys[key] = "skipped-empty"; continue; }   // don't clobber a good backup with []
      const ref = col.doc(key + "_" + day);
      const snap = await ref.get();
      if (isList && snap.exists && (snap.data().count || 0) > count) { result.keys[key] = "kept-larger"; continue; }
      await ref.set({ json: JSON.stringify(value), count, key, day, at: new Date().toISOString() });
      result.keys[key] = count;
    } catch (e) {
      result.keys[key] = "error:" + e.message;
    }
  }
  // prune restore points older than the retention window
  try {
    const cutoff = new Date(Date.now() + 8 * 3600 * 1000 - BACKUP_RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
    // .select() with no fields returns document REFS only. A plain col.get() would pull every
    // restore point's full `json` snapshot (~16 keys x 30 days of whole-database blobs) across the
    // wire just to read the ids — slow, billed per read, and a serverless timeout risk.
    const all = await col.select().get();
    const dels = [];
    all.forEach(doc => {
      const m = /_(\d{4}-\d{2}-\d{2})$/.exec(doc.id);
      if (m && m[1] < cutoff) dels.push(doc.ref.delete());
    });
    result.pruned = dels.length;
    if (dels.length) await Promise.all(dels);
  } catch (e) { result.pruneError = e.message; }
  return result;
}

// One self-contained, downloadable snapshot of ALL data — the off-site copy (email + download +
// local tools/backup.js). Raw image refs preserved so re-importing it is loss-free.
async function snapshot() {
  const data = {};
  for (const key of SHARED_KEYS) {
    try { data[key] = await readRawKey(key); } catch (e) { data[key] = null; }
  }
  return {
    meta: { app: "staycation-haven-ph", at: new Date().toISOString(), day: phDay(),
            backend, project: projectId, keys: SHARED_KEYS.length },
    data
  };
}

// List every available restore point (doc id → {key, day, count, at}) for the restore UI/CLI.
async function listBackups() {
  if (backend !== "firestore") return {};
  const out = {};
  // metadata only — never pull the `json` snapshot blobs just to list what's available
  const snap = await db.collection(BACKUP_COLLECTION).select("key", "day", "count", "at").get();
  snap.forEach(doc => {
    const d = doc.data() || {};
    out[doc.id] = { key: d.key || null, day: d.day || null, count: d.count || 0, at: d.at || null };
  });
  return out;
}

// Restore ONE key from a dated backup back into the live store. DESTRUCTIVE — replaces the live
// value for that key. Guarded at the route layer by the backup secret. Returns the count restored.
async function restoreKey(key, day) {
  if (backend !== "firestore") throw new Error("restore needs the Firestore backend");
  if (!SHARED_KEYS.includes(key)) throw new Error("unknown key: " + key);
  const snap = await db.collection(BACKUP_COLLECTION).doc(key + "_" + day).get();
  if (!snap.exists) throw new Error("no backup for " + key + " on " + day);
  const value = JSON.parse(snap.data().json);
  await db.collection(FS_COLLECTION).doc(key).set({ json: JSON.stringify(value) });
  if (cache) cache[key] = inlineImages(value);
  return Array.isArray(value) ? value.length : 1;
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
        projectId = account.project_id || null;
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
  putImage,        // POST /api/img stores one photo and returns its id (keeps saves small)
  init,
  backend: () => backend,
  imageStorage: () => !!bucket,   // true when Cloud Storage is active for images
  // A single health snapshot for /api/health: is persistence durable, where do images live,
  // and how many live records are in each shared list right now.
  status() {
    const c = ensureLoaded();
    const counts = {};
    for (const k of SHARED_KEYS) {
      const v = c[k];
      counts[k] = Array.isArray(v) ? v.filter(x => x && !x.deleted).length : (v && Object.keys(v).length ? 1 : 0);
    }
    return {
      ok: backend === "firestore",
      backend,                                                    // "firestore" (durable) | "file" (ephemeral!)
      durable: backend === "firestore",
      project: projectId,
      images: bucket ? "cloud-storage" : "firestore-fallback-1MB-cap",
      bucket: bucket ? bucket.name : null,
      counts,
      at: new Date().toISOString()
    };
  },
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
  backupAll,        // full daily backup of every shared key → shph_backups (+ 30-day prune)
  snapshot,         // one downloadable object of all data (off-site copy: email/download/CLI)
  listBackups,      // list every restore point (for the restore endpoint / CLI)
  restoreKey,       // restore ONE key from a dated backup (destructive — token-guarded)
  updateOneFresh,   // atomic single-record change (cancel/reinstate/delete) — fresh, transactional
  readFreshKey,     // live Firestore read of ONE key (bypasses stale per-instance cache)
  readFreshList,    // live Firestore read of an id-keyed list (bypasses stale per-instance cache)
  upsertOne,        // atomic insert-or-replace of one item by id (expenses/bills per-record)
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

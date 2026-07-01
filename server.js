/* ============================================================
   STAYCATION HAVEN PH — NODE.JS SERVER (Express + EJS)
   ------------------------------------------------------------
   - Renders every page as a server-side EJS template.
   - Serves a shared data backend (lib/store.js) over a small
     REST API at /api/kv/:key, replacing per-browser localStorage.
   - On each page load it injects the current data as window.__SEED__
     and loads /js/seed-bridge.js, so all the existing client-side
     code keeps working — but the data is now shared across devices.

   Run:  npm install  &&  npm start      (then open http://localhost:3000)
   ============================================================ */
"use strict";

const express = require("express");
const path = require("path");
const store = require("./lib/store");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "25mb" })); // QR images are base64 data URLs → allow large bodies

// On serverless hosts (e.g. Vercel) there is no long-lived process, so make sure
// the data store is initialised before the first request. The promise is cached,
// so init() actually runs only once per warm instance.
let _storeReady = null;
function ensureStore() {
  if (!_storeReady) _storeReady = store.init();
  return _storeReady;
}
app.use((req, res, next) => {
  ensureStore().then(() => next()).catch(next);
});

// Allow the old file:// page (and any device) to push data to the API.
app.use("/api", (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ---------------- REST API (the shared backend) ---------------- */
const apiRouter = express.Router();

// bulk import: { key: value, ... } → save every known shared key at once
apiRouter.post("/import", async (req, res) => {
  const body = req.body || {};
  const imported = {};
  const writes = [];
  for (const key of Object.keys(body)) {
    if (store.isShared(key) && body[key] != null) {
      writes.push(store.set(key, body[key]));
      imported[key] = Array.isArray(body[key]) ? body[key].length : "saved";
    }
  }
  await Promise.all(writes);
  res.json({ ok: true, imported });
});

// read every shared key at once
apiRouter.get("/kv", (req, res) => res.json(store.all()));

// read one key
apiRouter.get("/kv/:key", (req, res) => {
  if (!store.isShared(req.params.key)) return res.status(404).json({ error: "unknown key" });
  res.json(store.get(req.params.key));
});

// Id-keyed list stores that are merged per-item on save (multi-user safe + never erased).
// Only stores whose items have a stable unique `id` belong here — merging an id-less list
// would DROP records. (cleaning = object keyed by room; poolpass = no id → NOT here.)
const MERGE_LIST_KEYS = new Set([
  "shph_bookings_v3", "shph_bills_v1", "shph_expenses_v1",
  "shph_users", "shph_staff_v1", "staycation_havens"
]);

// write one key (body is the raw JSON value the browser stored)
apiRouter.put("/kv/:key", async (req, res) => {
  if (!store.isShared(req.params.key)) return res.status(403).json({ error: "key not shared" });
  try {
    if (MERGE_LIST_KEYS.has(req.params.key) && Array.isArray(req.body)) {
      // ATOMIC per-item merge against the LIVE doc (transaction): two users saving at once
      // never overwrite each other, and a stale cache can't drop another instance's records.
      await store.mergeListWrite(req.params.key, req.body);
    } else {
      // durable write: only report success once the backend confirms, so the client retries.
      await store.setStrict(req.params.key, req.body);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] PUT /kv/" + req.params.key + " failed to persist:", e.message);
    res.status(502).json({ ok: false, error: "persist failed" });
  }
});

// store ONE photo and return a tiny /img/<id> link. The browser calls this the moment a
// photo is attached, then saves only the link inside the booking — so the bookings payload
// stays small and never overflows the host's request-size limit (the cause of lost saves).
apiRouter.post("/img", async (req, res) => {
  try {
    const data = req.body && req.body.data;
    if (!data || typeof data !== "string") return res.status(400).json({ error: "no image data" });
    const id = await store.putImage(data);
    if (!id) return res.json({ url: null });   // file backend → no offload; client keeps the base64
    res.json({ id, url: "/img/" + id });
  } catch (e) {
    console.error("[api] POST /img failed:", e.message);
    res.status(502).json({ error: "image store failed" });
  }
});

// quick health/diagnostics — confirms which backend + whether Cloud Storage is active
app.get("/api/health", async (req, res) => {
  try { await ensureStore(); } catch (e) {}
  res.json({ backend: store.backend(), imageStorage: store.imageStorage() });
});

// stream a stored image by id (Cloud Storage, or the legacy Firestore doc).
// Image refs in the data are served as /img/<id> so payloads stay tiny.
app.get("/img/:id", async (req, res) => {
  try {
    await ensureStore();
    const img = await store.getImage(req.params.id);
    if (!img) return res.status(404).send("image not found");
    res.set("Content-Type", img.contentType || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(img.buffer);
  } catch (e) {
    console.error("[api] GET /img/" + req.params.id + " failed:", e.message);
    res.status(500).send("error");
  }
});

// delete one key (resets it)
apiRouter.delete("/kv/:key", async (req, res) => {
  if (!store.isShared(req.params.key)) return res.status(403).json({ error: "key not shared" });
  await store.remove(req.params.key);
  res.json({ ok: true });
});

// PER-RECORD payment write — appends (or edits) ONE payment on ONE booking, transactionally.
// This is the fix for the whole-array overwrite: the request only ever touches this booking, so
// collecting a payment can NEVER wipe another booking's data. The proof photo should already be
// a tiny /img ref (the browser offloads it via POST /api/img first). updateOneFresh reads the
// live doc inside a Firestore transaction and stamps updatedAt, so concurrent edits are safe.
apiRouter.post("/booking/:id/payment", async (req, res) => {
  const KEY = "shph_bookings_v3";
  const id = req.params.id;
  const payment = req.body && req.body.payment;
  const editIndex = (req.body && req.body.editIndex != null) ? Number(req.body.editIndex) : null;
  if (!payment || typeof payment !== "object") return res.status(400).json({ error: "no payment" });
  try {
    const ok = await store.updateOneFresh(KEY, id, b => {
      b.payments = Array.isArray(b.payments) ? b.payments : [];
      if (editIndex != null && b.payments[editIndex]) b.payments[editIndex] = payment;   // edit an existing collection
      else b.payments.push(payment);                                                      // record a new collection
    });
    if (!ok) return res.status(404).json({ error: "booking not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] booking payment failed:", e.message);
    res.status(502).json({ ok: false, error: "persist failed" });
  }
});

// GENERIC per-record write for id-keyed lists (expenses, bills, etc.): insert/replace ONE
// item, or soft-delete ONE item — transactionally, so adding/editing one record can never
// overwrite the rest of the list. Base64 images in the item (e.g. an expense receipt) are
// offloaded to refs by store.upsertOne.
apiRouter.post("/list/:key", async (req, res) => {
  const key = req.params.key;
  if (!MERGE_LIST_KEYS.has(key)) return res.status(400).json({ error: "not a per-record list" });
  const upsert = req.body && req.body.upsert;   // full item to insert/replace (by id)
  const del = req.body && req.body.del;          // id to soft-delete
  try {
    if (upsert && upsert.id != null) {
      await store.upsertOne(key, upsert);
    } else if (del != null) {
      const ok = await store.updateOneFresh(key, del, x => { x.deleted = true; if (!x.deletedAt) x.deletedAt = new Date().toISOString(); });
      if (!ok) return res.status(404).json({ error: "item not found" });
    } else {
      return res.status(400).json({ error: "nothing to do" });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] POST /list/" + key + " failed:", e.message);
    res.status(502).json({ ok: false, error: "persist failed" });
  }
});

// PER-RECORD deposit-return write — sets/clears the deposit fields on ONE booking,
// transactionally. Same protection as payments: marking a deposit returned can never wipe
// another booking. The refund photo should already be a tiny /img ref (offloaded via /api/img).
apiRouter.post("/booking/:id/deposit", async (req, res) => {
  const KEY = "shph_bookings_v3";
  const id = req.params.id;
  const set = req.body && req.body.set;   // fields to set (e.g. depositReturned + proof + refund)
  const del = req.body && req.body.del;   // field names to delete (for undo)
  if (!set && !del) return res.status(400).json({ error: "nothing to change" });
  try {
    const ok = await store.updateOneFresh(KEY, id, b => {
      if (Array.isArray(del)) del.forEach(k => delete b[k]);
      if (set && typeof set === "object") Object.assign(b, set);
    });
    if (!ok) return res.status(404).json({ error: "booking not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] booking deposit failed:", e.message);
    res.status(502).json({ ok: false, error: "persist failed" });
  }
});

// lightweight per-booking status change — cancel / reinstate / delete.
// The browser only sends the id + action (tiny), so a quick refresh can't lose it
// (unlike re-uploading the whole bookings array, which carries base64 images).
apiRouter.post("/booking/:id/:action", async (req, res) => {
  const KEY = "shph_bookings_v3";
  const id = req.params.id, action = req.params.action;
  let ok;
  try {
    if (action === "cancel") {
      ok = await store.updateOneFresh(KEY, id, b => { b.cancelled = true; if (!b.cancelledAt) b.cancelledAt = new Date().toISOString(); });
    } else if (action === "reinstate") {
      ok = await store.updateOneFresh(KEY, id, b => { delete b.cancelled; delete b.cancelledAt; });
    } else if (action === "delete") {
      // SOFT delete: the record is NEVER erased — just flagged (and hidden in the dashboard).
      ok = await store.updateOneFresh(KEY, id, b => { b.deleted = true; if (!b.deletedAt) b.deletedAt = new Date().toISOString(); });
    } else {
      return res.status(400).json({ error: "unknown action" });
    }
  } catch (e) {
    console.error("[api] booking action failed:", e.message);
    return res.status(502).json({ ok: false, error: "persist failed" });
  }
  if (!ok) return res.status(404).json({ error: "booking not found" });
  res.json({ ok: true });
});

app.use("/api", apiRouter);

/* ---------------- Pages (server-rendered EJS) ---------------- */
// Every page that has real content. Empty placeholder files are skipped.
const PAGES = [
  "index", "havens", "booknow", "payment",
  "admin", "dashboard", "todaysbooking", "Nicole", "payroll",
  "partner-login"
];

function renderPage(name) {
  return (req, res) => {
    res.render(name, { seed: store.all(), page: name }, (err, html) => {
      if (err) {
        console.error("Render error for", name, "—", err.message);
        return res.status(500).send("Page render error: " + err.message);
      }
      res.send(html);
    });
  };
}

for (const name of PAGES) {
  const handler = renderPage(name);
  app.get("/" + name, handler);          // clean URL  e.g. /havens
  app.get("/" + name + ".html", handler); // keep old links working e.g. /havens.html
}
app.get("/", renderPage("index"));
// Partner dashboard: serves the dashboard view at a partner-branded URL.
// Single path segment so the dashboard's relative assets still resolve to root.
// Partner mode is detected client-side from this path (see dashboard.html).
app.get("/partners", renderPage("dashboard"));
app.get("/partner-dashboard", renderPage("dashboard"));   // alias

/* ---------------- Static assets ---------------- */
// Client JS/CSS live in /public; images stay in /images.
// The project root is intentionally NOT served, so server.js / data
// / package.json are never exposed.
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// Run a normal long-lived server only when started directly (local / VPS).
// On Vercel the app is imported as a serverless handler instead (see api/index.js),
// so we must NOT call app.listen there.
if (require.main === module) {
  ensureStore()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Staycation Haven PH running →  http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to initialise data store:", err);
      process.exit(1);
    });
}

module.exports = app;

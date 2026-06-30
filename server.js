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

// Multi-user merge for bookings: combine the incoming list with what's already on the
// server (by booking id) instead of replacing it wholesale. So when two people save at
// the same time, neither overwrites the other's bookings. Bookings only this client is
// missing (added by someone else) are KEPT; bookings deleted via the /booking delete
// endpoint are tombstoned and excluded, so a stale client can't resurrect them.
// Id-keyed list stores that are merged per-item on save (multi-user safe + never erased).
// Only stores whose items have a stable unique `id` belong here — merging an id-less list
// would DROP records. (cleaning = object keyed by room; poolpass = no id → NOT here.)
const MERGE_LIST_KEYS = new Set([
  "shph_bookings_v3", "shph_bills_v1", "shph_expenses_v1",
  "shph_users", "shph_staff_v1", "staycation_havens"
]);
function mergeList(stored, incoming) {
  const byId = new Map();
  for (const b of stored) if (b && b.id != null) byId.set(String(b.id), b);
  for (const b of incoming) {
    if (!b || b.id == null) continue;
    const cur = byId.get(String(b.id));
    // never let a stale client UN-delete a record the server already marked deleted
    if (cur && cur.deleted && !b.deleted) continue;
    byId.set(String(b.id), b);
  }
  return Array.from(byId.values());
}

// write one key (body is the raw JSON value the browser stored)
apiRouter.put("/kv/:key", async (req, res) => {
  if (!store.isShared(req.params.key)) return res.status(403).json({ error: "key not shared" });
  try {
    let value = req.body;
    if (MERGE_LIST_KEYS.has(req.params.key) && Array.isArray(value)) {
      value = mergeList(store.get(req.params.key) || [], value);   // never overwrite another user's records
    }
    // durable write: only report success once the backend (Firestore) confirms,
    // so a client knows to retry instead of silently losing the change.
    await store.setStrict(req.params.key, value);
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] PUT /kv/" + req.params.key + " failed to persist:", e.message);
    res.status(502).json({ ok: false, error: "persist failed" });
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

// lightweight per-booking status change — cancel / reinstate / delete.
// The browser only sends the id + action (tiny), so a quick refresh can't lose it
// (unlike re-uploading the whole bookings array, which carries base64 images).
apiRouter.post("/booking/:id/:action", async (req, res) => {
  const KEY = "shph_bookings_v3";
  const arr = store.get(KEY) || [];
  const idx = arr.findIndex(x => String(x.id) === String(req.params.id));
  const action = req.params.action;
  if (idx < 0) return res.status(404).json({ error: "booking not found" });
  if (action === "cancel") {
    arr[idx].cancelled = true;
    if (!arr[idx].cancelledAt) arr[idx].cancelledAt = new Date().toISOString();
  } else if (action === "reinstate") {
    delete arr[idx].cancelled;
    delete arr[idx].cancelledAt;
  } else if (action === "delete") {
    // SOFT delete: the record is NEVER erased from the server — just flagged (and hidden in
    // the dashboard). mergeBookings keeps it deleted so a stale client can't un-delete it.
    arr[idx].deleted = true;
    if (!arr[idx].deletedAt) arr[idx].deletedAt = new Date().toISOString();
  } else {
    return res.status(400).json({ error: "unknown action" });
  }
  await store.set(KEY, arr);
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

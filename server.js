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

// write one key (body is the raw JSON value the browser stored)
apiRouter.put("/kv/:key", async (req, res) => {
  if (!store.isShared(req.params.key)) return res.status(403).json({ error: "key not shared" });
  await store.set(req.params.key, req.body);
  res.json({ ok: true });
});

// delete one key (resets it)
apiRouter.delete("/kv/:key", async (req, res) => {
  if (!store.isShared(req.params.key)) return res.status(403).json({ error: "key not shared" });
  await store.remove(req.params.key);
  res.json({ ok: true });
});

app.use("/api", apiRouter);

/* ---------------- Pages (server-rendered EJS) ---------------- */
// Every page that has real content. Empty placeholder files are skipped.
const PAGES = [
  "index", "havens", "booknow", "payment",
  "admin", "dashboard", "todaysbooking", "Nicole", "payroll"
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

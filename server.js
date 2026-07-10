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
apiRouter.get("/kv/:key", async (req, res) => {
  const key = req.params.key;
  if (!store.isShared(key)) return res.status(404).json({ error: "unknown key" });
  // For id-keyed list stores (bookings, etc.) read the LIVE Firestore doc, not this
  // serverless instance's in-memory cache — a warm instance can hold a stale copy that
  // is missing a record saved via another instance (e.g. a website booking), which is
  // exactly how a real booking "doesn't show up" on the dashboard. Fall back to cache.
  if (MERGE_LIST_KEYS.has(key)) {
    try { return res.json(await store.readFreshList(key)); }
    catch (e) { console.warn("[api] fresh read failed for", key, "—", e.message); }
  }
  res.json(store.get(key));
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

// ---- website visit counter — records a unique visit (deduped once/day per browser, client-side) ----
apiRouter.post("/visit", async (req, res) => {
  try {
    let v = await store.readFreshKey("shph_visits");
    if (!v || typeof v !== "object" || Array.isArray(v)) v = { total: 0, days: {} };
    if (!v.days || typeof v.days !== "object") v.days = {};
    const day = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);   // Philippine calendar day (UTC+8)
    v.total = (Number(v.total) || 0) + 1;
    v.days[day] = (Number(v.days[day]) || 0) + 1;
    const keep = Object.keys(v.days).sort().slice(-180);   // bound the daily history
    const trimmed = {}; for (const d of keep) trimmed[d] = v.days[d];
    v.days = trimmed;
    await store.set("shph_visits", v);
    res.set("Cache-Control", "no-store");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
apiRouter.get("/visits", async (req, res) => {
  try {
    let v = await store.readFreshKey("shph_visits");
    if (!v || typeof v !== "object" || Array.isArray(v)) v = { total: 0, days: {} };
    res.set("Cache-Control", "no-store");
    res.json({ total: Number(v.total) || 0, days: v.days || {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
  try { res.json(store.status()); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// friendly, human-readable health page — open /health anytime to confirm data + images are safe
app.get("/health", async (req, res) => {
  try { await ensureStore(); } catch (e) {}
  let s;
  try { s = store.status(); } catch (e) { s = { ok: false, error: e.message }; }
  const green = "#127a3d", red = "#c0283d", gray = "#5b6470";
  const row = (label, value, good) =>
    `<tr><td style="padding:9px 14px;color:${gray};white-space:nowrap">${label}</td>` +
    `<td style="padding:9px 14px;font-weight:700;color:${good == null ? "#1b1f24" : (good ? green : red)}">${value}</td></tr>`;
  const counts = s.counts || {};
  const countRows = Object.keys(counts).map(k => row(k, counts[k], null)).join("");
  const durable = !!s.durable;
  const imgGood = s.images === "cloud-storage";
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Staycation Haven — System Health</title>
<body style="margin:0;font:15px/1.5 system-ui,Segoe UI,Arial,sans-serif;background:#f4f6f8;color:#1b1f24">
<div style="max-width:560px;margin:32px auto;padding:0 16px">
  <h1 style="font-size:20px;margin:0 0 4px">System Health</h1>
  <div style="color:${gray};font-size:13px;margin-bottom:18px">Live check of where your data &amp; photos are stored.</div>
  <div style="background:${durable ? green : red};color:#fff;border-radius:12px;padding:16px 18px;font-weight:700;font-size:16px;margin-bottom:16px">
    ${durable ? "✅ Data is DURABLE — saved permanently to Firestore." : "🚨 NOT DURABLE — running on temporary file storage. Data can be lost on restart! Set FIREBASE_SERVICE_ACCOUNT."}
  </div>
  <div style="background:#fff;border:1px solid #e3e7ec;border-radius:12px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row("Backend", s.backend || "?", durable)}
      ${row("Firebase project", s.project || "—", null)}
      ${row("Image storage", s.images === "cloud-storage" ? "Cloud Storage (unlimited)" : "Firestore fallback (1 MB cap ⚠️)", imgGood)}
      ${row("Storage bucket", s.bucket || "—", null)}
      <tr><td colspan="2" style="padding:12px 14px 4px;color:${gray};font-size:12px;text-transform:uppercase;letter-spacing:.04em">Records stored right now</td></tr>
      ${countRows}
      ${row("Checked at", s.at || "", null)}
    </table>
  </div>
  <div style="color:${gray};font-size:12px;margin-top:14px">Refresh this page anytime. Green = your data and photos are safe on the server.</div>
</div>`;
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
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
  const deleteIndex = (req.body && req.body.deleteIndex != null) ? Number(req.body.deleteIndex) : null;
  const editId = req.body && req.body.editId;      // stable payment id (pid) — match by this, not array position
  const deleteId = req.body && req.body.deleteId;  // so a concurrent add elsewhere can't shift the target
  const isDelete = (deleteId != null || deleteIndex != null);
  if ((!payment || typeof payment !== "object") && !isDelete) return res.status(400).json({ error: "no payment" });
  try {
    const ok = await store.updateOneFresh(KEY, id, b => {
      b.payments = Array.isArray(b.payments) ? b.payments : [];
      if (isDelete) {                                                     // remove one collection
        let di = -1;
        if (deleteId != null) di = b.payments.findIndex(p => p && p.pid === deleteId);  // match by stable id
        else if (deleteIndex != null) di = deleteIndex;                   // legacy (no id sent) → position
        // if an id WAS sent but not found, it's already gone → no-op (never index-fallback, which would hit the neighbor)
        if (di >= 0 && b.payments[di]) b.payments.splice(di, 1);
      } else {                                                            // edit or add a collection
        let ei = -1;
        if (editId != null) ei = b.payments.findIndex(p => p && p.pid === editId);      // match by stable id
        else if (editIndex != null) ei = editIndex;                      // legacy (no id sent) → position
        if (ei >= 0 && b.payments[ei]) b.payments[ei] = payment;         // edit the matched collection
        else if (editId == null && editIndex == null) b.payments.push(payment);  // brand-new collection
        // id sent but not found → the payment is gone; do nothing (don't resurrect or duplicate)
      }
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

// Read a booking's CURRENT guest IDs live from the server, so the editor shows the true saved set
// (a stale browser copy could otherwise show fewer/none — and then overwrite the real ones on save).
apiRouter.get("/booking/:id/ids", async (req, res) => {
  try {
    const arr = await store.readFreshList("shph_bookings_v3");
    const b = Array.isArray(arr) ? arr.find(x => String(x.id) === String(req.params.id)) : null;
    if (!b) return res.status(404).json({ error: "booking not found" });
    res.json({ ids: Array.isArray(b.ids) ? b.ids : [], idOptOut: !!b.idOptOut });
  } catch (e) {
    console.error("[api] GET booking ids failed:", e.message);
    res.status(502).json({ error: "read failed" });
  }
});

// PER-RECORD guest-ID save. Writing the ids the moment they're uploaded (not deferred to the
// whole-booking Save) means a stale whole-array save from another tab/device can't wipe them.
// Photos should already be tiny /img refs (offloaded via /api/img) before being sent here.
apiRouter.post("/booking/:id/ids", async (req, res) => {
  const KEY = "shph_bookings_v3";
  const id = req.params.id;
  const ids = req.body && req.body.ids;
  const idOptOut = req.body && req.body.idOptOut;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
  try {
    const ok = await store.updateOneFresh(KEY, id, b => {
      b.ids = ids;
      if (typeof idOptOut === "boolean") b.idOptOut = idOptOut;
    });
    if (!ok) return res.status(404).json({ error: "booking not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] booking ids failed:", e.message);
    res.status(502).json({ ok: false, error: "persist failed" });
  }
});

// PER-RECORD field patch for a booking. Applies ONLY the given fields to the LIVE record inside a
// transaction (Object.assign), so editing a booking's dates/notes/etc. can never wipe fields owned
// by other per-record paths (payments, ids, deposit-return) or clobber another device's edit.
apiRouter.post("/booking/:id/patch", async (req, res) => {
  const KEY = "shph_bookings_v3";
  const id = req.params.id;
  const set = req.body && req.body.set;
  if (!set || typeof set !== "object" || Array.isArray(set)) return res.status(400).json({ error: "nothing to change" });
  try {
    const ok = await store.updateOneFresh(KEY, id, b => { Object.assign(b, set); });
    if (!ok) return res.status(404).json({ error: "booking not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] booking patch failed:", e.message);
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

// ---- Email the guest a booking confirmation (Gmail SMTP via nodemailer) --------------
// The client sends structured booking fields (never raw HTML), so this can't be abused to
// send arbitrary content. Requires GMAIL_USER + GMAIL_APP_PASSWORD env vars; OWNER_EMAIL
// (optional) gets a BCC copy. Returns { ok:false, error:"not_configured" } until set up,
// so the booking still succeeds even before email is wired.
const _esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function _confirmationHtml(bk) {
  const row = (k, v) => `<tr><td style="padding:7px 0;color:#6a6459;font-size:14px">${_esc(k)}</td><td style="padding:7px 0;text-align:right;font-weight:600;color:#1c1a17;font-size:14px">${_esc(v)}</td></tr>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#faf6ef;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #ece5d7;border-radius:16px;overflow:hidden">
      <div style="background:#1c1a17;color:#f0d488;padding:20px 24px;font-size:20px;font-weight:700">Staycation Haven PH</div>
      <div style="padding:24px">
        <h2 style="margin:0 0 4px;color:#1c1a17;font-size:22px">Thank you for booking with us! 🏠</h2>
        <p style="color:#6a6459;font-size:14px;margin:0 0 4px">We’ve received your reservation and are reviewing your payment.</p>
        <p style="color:#a9842b;font-weight:700;font-size:15px;margin:0 0 16px">Booking #${_esc(bk.code || "")}</p>
        <table style="width:100%;border-collapse:collapse">
          ${row("Haven", bk.haven)}
          ${row("Check-in", bk.checkin)}
          ${row("Check-out", bk.checkout)}
          ${row("Stay", bk.stay)}
          ${bk.guests ? row("Guests", bk.guests) : ""}
          ${bk.contact ? row("Contact", bk.contact) : ""}
          <tr><td colspan="2" style="border-top:1px solid #ece5d7;padding-top:6px"></td></tr>
          ${row("Total", bk.total)}
          ${row("Downpayment", bk.downpayment)}
          ${row("Balance on arrival", bk.balance)}
        </table>
        <p style="color:#6a6459;font-size:13.5px;margin:18px 0 0">Please message us with your booking number <b>${_esc(bk.code || "")}</b> to confirm your booking. We’ll message a confirmation once your payment is verified. See you at your staycation! ❤️</p>
        <p style="margin:14px 0 0"><a href="https://www.facebook.com/staycationhavenph" style="color:#a9842b">facebook.com/staycationhavenph</a></p>
      </div>
      <div style="background:#f2ece0;color:#9a9384;padding:14px 24px;font-size:12px;text-align:center">© Staycation Haven PH · Mplace Tower D, Panay Ave, Quezon City</div>
    </div>
  </div>`;
}
apiRouter.post("/send-confirmation", async (req, res) => {
  try {
    const { to, booking } = req.body || {};
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return res.status(400).json({ ok: false, error: "bad_email" });
    if (!booking || typeof booking !== "object") return res.status(400).json({ ok: false, error: "no_booking" });
    const user = process.env.GMAIL_USER || "staycationhavenph@gmail.com";
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;   // reuse existing EMAIL_PASSWORD if set
    if (!pass) return res.status(200).json({ ok: false, error: "not_configured" });
    let nodemailer;
    try { nodemailer = require("nodemailer"); } catch (e) { return res.status(200).json({ ok: false, error: "not_installed" }); }
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    // subject = "MMDDYYYY - CODE" (date it was booked · booking #). Prefer the client's booked date;
    // else fall back to the server clock shifted to PH time (UTC+8).
    const _ph = new Date(Date.now() + 8 * 3600 * 1000);
    const _bookedOn = booking.bookedOn || (String(_ph.getUTCMonth() + 1).padStart(2, "0") + String(_ph.getUTCDate()).padStart(2, "0") + _ph.getUTCFullYear());
    await transporter.sendMail({
      from: `"Staycation Haven PH" <${user}>`,
      to: String(to),
      bcc: process.env.OWNER_EMAIL || "staycationhavenph@gmail.com, piacarlaclav@gmail.com",   // owner copies
      subject: `NEW BOOKING - ${_bookedOn} - ${String(booking.code || "").slice(0, 12)}`,
      html: _confirmationHtml(booking)
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("[api] send-confirmation failed:", e.message);
    res.status(200).json({ ok: false, error: "send_failed" });
  }
});

app.use("/api", apiRouter);

/* ---------------- Pages (server-rendered EJS) ---------------- */
// Every page that has real content. Empty placeholder files are skipped.
const PAGES = [
  "index", "havens", "booknow", "payment",
  "admin", "dashboard", "todaysbooking", "Nicole", "nicole-dashboard", "payroll",
  "partner-login"
];

// Guest-facing pages that the website Maintenance switch takes offline.
const PUBLIC_PAGES = new Set(["index", "havens", "booknow", "payment"]);

// A friendly, branded "we'll be right back" page shown to guests while the owner has the website
// under maintenance. Self-contained (no external assets except the logo) so it always renders.
function maintenanceHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Staycation Haven PH — We'll be right back</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#faf6ef;
    color:#1c1a17;font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;padding:24px;text-align:center}
  .card{max-width:460px}
  .logo{width:78px;height:78px;border-radius:18px;background:#fff;border:1px solid #ece5d7;overflow:hidden;
    display:flex;align-items:center;justify-content:center;margin:0 auto 26px;box-shadow:0 12px 34px rgba(120,90,30,.14)}
  .logo img{width:100%;height:100%;object-fit:contain}
  h1{font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:800;margin-bottom:14px}
  p{font-size:15px;line-height:1.65;color:#6a6459}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#a9842b;margin-right:9px;
    vertical-align:middle;animation:pulse 1.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:.35;transform:scale(.9)}50%{opacity:1;transform:scale(1)}}
  .tag{margin-top:28px;font-size:12px;color:#a9842b;font-weight:800;letter-spacing:1.4px;text-transform:uppercase}
</style></head><body>
  <div class="card">
    <div class="logo"><img src="/images/logo.png" alt="Staycation Haven PH"></div>
    <h1><span class="dot"></span>We'll be right back</h1>
    <p>Our website is currently under maintenance.<br>Please check back in a few minutes — thank you for your patience! 💛</p>
    <div class="tag">Staycation Haven PH</div>
  </div>
</body></html>`;
}

function renderPage(name) {
  return async (req, res) => {
    const seed = store.all();
    // The bookings a page renders with (dashboard list, calendar, website
    // availability) must reflect the TRUE current list — not this serverless
    // instance's possibly-stale in-memory cache. A warm instance can be missing a
    // booking saved via another instance (e.g. a website booking), so it would
    // silently vanish from the dashboard or a taken slot would look free. Read the
    // live Firestore list for the seed; fall back to the cache if that read fails.
    try {
      const freshBookings = await store.readFreshList("shph_bookings_v3");
      if (Array.isArray(freshBookings)) seed.shph_bookings_v3 = freshBookings;
    } catch (e) {
      console.warn("[render] fresh bookings read failed for", name, "—", e.message);
    }
    // Website Maintenance switch: guest-facing pages show a "back soon" notice while it's on. Read
    // the flag FRESH so a stale per-instance cache can't keep the site up after the owner takes it
    // down. The dashboard/admin pages are NOT gated, so the owner can always flip it back.
    if (PUBLIC_PAGES.has(name)) {
      try {
        const freshSettings = await store.readFreshKey("shph_settings");
        if (freshSettings) seed.shph_settings = freshSettings;
        if (freshSettings && freshSettings.site && freshSettings.site.maintenance) {
          return res.status(503).set("Retry-After", "300").send(maintenanceHtml());
        }
      } catch (e) {
        console.warn("[render] maintenance check failed for", name, "—", e.message);
      }
    }
    // Never let the browser/CDN serve a STALE cached page HTML — the dashboard changes often and
    // a cached old copy shows the wrong sidebar/menu. Always revalidate the HTML (assets in
    // /public keep their own caching, so this doesn't hurt load speed meaningfully).
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.render(name, { seed, page: name }, (err, html) => {
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

// Nicole's branded shortcut URLs — the same back-office pages behind friendlier addresses.
// No auth change: each page still requires a logged-in user (the client bounces to the login
// screen if none). Single path segment so the pages' relative assets still resolve to root.
// The dashboard opens straight to the matching section, detected client-side (see dashboard.html).
app.get("/nicole-todaysbooking", renderPage("nicole-dashboard"));   // Nicole's premium redesigned Today's Booking
app.get("/nicole-board",     renderPage("dashboard"));
app.get("/nicole-calendar",  renderPage("dashboard"));
app.get("/nicole-guestform", renderPage("dashboard"));
app.get("/nicole-deposit",   renderPage("dashboard"));

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

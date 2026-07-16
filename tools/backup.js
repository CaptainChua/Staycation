/* ============================================================
   STAYCATION HAVEN PH — LOCAL OFF-SITE BACKUP
   ------------------------------------------------------------
   Pulls EVERY shared key from the live store (the same Firestore
   the website uses, via serviceAccountKey.json) and writes one
   timestamped JSON file to ./backups/. This is your OFF-SITE copy
   on your own computer — safe even if the whole Firebase project
   were ever lost.

   Run it anytime:
     node tools/backup.js

   Automate it (Windows Task Scheduler): create a Basic Task that
   runs daily and starts `node` with argument `tools/backup.js` in
   this project folder.

   Then copy the newest file in ./backups/ to Google Drive / a USB
   for a true off-site copy.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const store = require("../lib/store");

(async () => {
  await store.init();

  const status = store.status();
  if (status.backend !== "firestore") {
    console.error("⚠️  Not connected to Firestore (backend = " + status.backend + ").");
    console.error("    Put your serviceAccountKey.json in the project root, then try again.");
    process.exit(1);
  }

  const snap = await store.snapshot();
  const stamp = snap.meta.at.replace(/[:.]/g, "-");          // filesystem-safe timestamp
  const dir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `shph-backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(snap, null, 2), "utf8");

  const counts = Object.keys(snap.data).map(k => {
    const v = snap.data[k];
    const n = Array.isArray(v) ? v.length : (v && typeof v === "object" ? Object.keys(v).length : (v != null ? 1 : 0));
    return `   • ${k}: ${n}`;
  }).join("\n");

  console.log("✅ Off-site backup written:\n   " + file + "\n\nRecords:\n" + counts +
    "\n\nTip: copy this file to Google Drive or a USB for a true off-site copy.");
  process.exit(0);
})().catch(e => {
  console.error("❌ Backup failed:", e.message);
  process.exit(1);
});

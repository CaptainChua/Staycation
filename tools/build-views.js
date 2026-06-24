/* ============================================================
   BUILD VIEWS
   ------------------------------------------------------------
   Generates views/<page>.ejs from each source <page>.html by
   injecting the shared seed partial at the top of <head>, and
   copies the client-side assets into /public so Express can
   serve them. Re-run with:  npm run build:views
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VIEWS = path.join(ROOT, "views");
const PUBLIC = path.join(ROOT, "public");

const PAGES = [
  "index", "havens", "booknow", "payment",
  "admin", "dashboard", "todaysbooking", "Nicole", "payroll"
];

const ASSETS = ["style.css", "havens-data.js", "site-settings.js", "script.js", "db.js", "amenity-icons.js"];

const SEED_INCLUDE = "\n<%- include('partials/seed') %>\n";

fs.mkdirSync(VIEWS, { recursive: true });
fs.mkdirSync(PUBLIC, { recursive: true });

let madeViews = 0;
for (const name of PAGES) {
  const src = path.join(ROOT, name + ".html");
  if (!fs.existsSync(src)) {
    console.warn("skip (missing):", name + ".html");
    continue;
  }
  let html = fs.readFileSync(src, "utf8");

  // Inject the seed partial right after the opening <head> tag so it runs
  // before any page script. If there's no <head>, prepend it.
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => m + SEED_INCLUDE);
  } else {
    html = SEED_INCLUDE + html;
  }

  fs.writeFileSync(path.join(VIEWS, name + ".ejs"), html, "utf8");
  madeViews++;
}

let copied = 0;
for (const asset of ASSETS) {
  const src = path.join(ROOT, asset);
  if (!fs.existsSync(src)) { console.warn("skip asset (missing):", asset); continue; }
  fs.copyFileSync(src, path.join(PUBLIC, asset));
  copied++;
}

console.log(`Built ${madeViews} view(s) → /views, copied ${copied} asset(s) → /public`);

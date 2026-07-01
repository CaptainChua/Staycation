# StaycationHaven PH — System Architecture & Lifecycle

> A complete reference for how the system is structured, how data flows, and how
> data is kept safe. Last updated: 2026-07-01 (branch `pia-side`).

---

## 1. What this system is

An admin dashboard + public booking site for a staycation rental business
(multiple "havens"/units). It handles bookings, payments, security deposits,
guest IDs, bills, expenses, payroll, housekeeping, and business analytics — with
a hard requirement: **no data may ever be lost, even across multiple browsers,
devices, and users.**

---

## 2. Tech stack & hosting

| Layer | Technology |
|---|---|
| Hosting | **Vercel** (serverless), production branch **`pia-side`**, region `iad1` |
| Server | **Node.js + Express** (`server.js`) |
| Views | **EJS** server-rendered pages (`/views/*.ejs`) |
| Database | **Google Cloud Firestore** (project `staycation-haven-ph`) |
| Image storage | **Firebase Cloud Storage** (bucket `staycation-haven-ph.firebasestorage.app`) |
| Auth to Firebase | **Firebase Admin SDK** via a service-account key (env `FIREBASE_SERVICE_ACCOUNT`) — bypasses Firestore/Storage security rules |
| Client data cache | Browser **localStorage**, mirrored to the server |

> Because the server uses the **Admin SDK**, the Firestore/Storage security rules
> (`allow read, write: if false`) do **not** affect the app — the browser never
> talks to Firebase directly, only to the Express server.

---

## 3. High-level architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER (admin dashboard / guest site)                            │
│                                                                    │
│   Pages read/write localStorage synchronously (legacy design)      │
│        │                                                           │
│        ▼                                                           │
│   seed-bridge.js  ── wraps localStorage.setItem ──┐                │
│     • hydrates localStorage from server on load    │               │
│     • durable retry queue (never gives up)         │               │
│     • offloads base64 images → /img/<id> refs      │               │
│     • window.shphSetLocal() = local write, no push │               │
└────────────────────────────────────────────────────┼──────────────┘
                                                      │  HTTPS /api/...
                                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  EXPRESS SERVER (server.js)  — on Vercel                           │
│     • serves EJS pages (seeded with live data)                     │
│     • REST API (/api/kv, /api/list, /api/booking/:id/*, /api/img)  │
│        │                                                           │
│        ▼                                                           │
│   lib/store.js  — the data layer                                   │
│     • Firestore read/write (transactional per-record merges)       │
│     • image offload to Cloud Storage                               │
│     • rolling backups                                              │
└────────────────────────────────────────────────────┼──────────────┘
                                                      ▼
        Firestore (structured data)   +   Cloud Storage (photos)
        project: staycation-haven-ph       bucket: …firebasestorage.app
```

---

## 4. File / directory structure

```
StaycationhavenPH/
├── server.js                  Express app: API routes + page rendering
├── lib/
│   └── store.js               Data layer: Firestore + Cloud Storage + backups
├── public/                    Static assets served at site root
│   ├── js/seed-bridge.js      Client↔server sync bridge (the heart of durability)
│   ├── havens-data.js         Haven defaults + loadHavens/saveHavens (sorted by `order`)
│   ├── db.js                  Legacy DB.* API (LocalAdapter — localStorage only)
│   ├── partners.js            Partner-dashboard behaviour
│   └── … (style.css, site-settings.js, amenity-icons.js, script.js)
├── views/                     BUILD OUTPUT — generated EJS (do not hand-edit)
│   ├── dashboard.ejs          (from dashboard.html)
│   ├── todaysbooking.ejs, payment.ejs, booknow.ejs, havens.ejs …
│   └── partials/seed.ejs      Injects window.__SEED__ + <script src=/js/seed-bridge.js>
├── tools/build-views.js       Builds *.html → views/*.ejs, copies /public assets
├── data/store.json            Local file backend (dev only — NOT used on Vercel)
├── serviceAccountKey.json     Firebase creds (git-ignored; prod uses env var)
│
│  SOURCE HTML (edited by hand; build turns them into views/*.ejs):
├── dashboard.html             ★ The admin "backend" — the main app (~10.6k lines)
├── todaysbooking.html         Front-desk "Today's Booking" screen
├── booknow.html, payment.html Guest-facing booking + payment flow
├── havens.html, index.html    Public marketing pages
├── admin.html                 Admin login
├── payroll.html, Nicole.html  Payroll / employee views
└── partner-login.html         Partner login
```

**Build rule:** edit the `.html` files, then run `node tools/build-views.js` to
regenerate `views/*.ejs` and copy `/public` assets. The server renders the `.ejs`.

---

## 5. Data model (the "tables")

All shared data lives in Firestore collection **`shph_store`**, **one document
per key**, each storing its value as a JSON string in a `json` field. The keys
(`SHARED_KEYS` in `lib/store.js`):

| Key | Contents | Shape |
|---|---|---|
| `shph_bookings_v3` | **Bookings** (the core) — guests, dates, payments[], ids[], proofs, deposit | list (id-keyed) |
| `staycation_havens` | Haven listings (name, price, gallery, amenities, `order`) | list |
| `shph_bills_v1` | Bills payable (utilities, rent…) + photos | list |
| `shph_expenses_v1` | Operating expenses + receipts | list |
| `shph_staff_v1` | Staff/payroll records | list |
| `shph_users` | Dashboard user accounts + permissions | list |
| `shph_cleaning_v1` | Housekeeping reports + photos | list |
| `shph_partners` / `shph_partner_board` | Partner data | list |
| `shph_poolpass_v1`, `shph_guestform_units`, `shph_employee_nicole` | Misc feature data | list/doc |
| `shph_settings` | Booking rates & payment settings | single doc |
| `shph_activity_log` | Audit log of admin actions | list |
| `shph_deleted_bookings` | Legacy deleted-booking store | list |

**Images** are never stored inline. Each photo is uploaded to Cloud Storage under
`shph-images/<id>` and referenced in the data as the tiny string `/img/<id>`.

**Backups:** collection **`shph_backups`** keeps one rolling document per day per
critical key (currently `shph_bookings_v3`), that never shrinks and never stores
an empty list.

---

## 6. The data lifecycle (request → storage)

### On page load (hydration)
1. Server renders the EJS page and injects `window.__SEED__` = current data from
   Firestore (`store.all()`), plus `<script src="/js/seed-bridge.js">`.
2. `seed-bridge.js` primes `localStorage` from the seed so the page's synchronous
   `localStorage.getItem(...)` reads return live, shared data.
3. For **merge-list keys**, it merges local + server by `id` (keeping the newer
   `updatedAt`) so an unsynced local edit is never wiped — and re-pushes anything
   the server is still missing.

### On a write (the modern per-record path)
1. Page code mutates its in-memory array and calls a **per-record** helper.
2. The helper **stamps + mirrors locally** (`_stampLocal` + `shphSetLocal`) so the
   change is durable on the device and re-pushable, then
3. Fires a **per-record API call** (`/api/booking/:id/patch`, `/payment`, `/ids`,
   `/deposit`, or `/api/list/:key`).
4. The server runs a **Firestore transaction** that reads the LIVE document,
   applies the one change, stamps `updatedAt`, and writes back — so concurrent
   saves from different devices can never overwrite each other.
5. Images in the payload are offloaded to Cloud Storage first; only `/img/<id>`
   refs are stored.

### On failure
- The local mirror already holds the change (stamped newest), so the **next page
  load's prime-merge re-pushes it** through the durable retry queue. Interactive
  saves (e.g. Save Booking) also alert the user and keep the window open.

---

## 7. Client sync bridge (`public/js/seed-bridge.js`)

The single most important file for durability. Responsibilities:

- **Hydration** — primes localStorage from `window.__SEED__`; merges id-keyed
  lists so nothing is lost on refresh.
- **Wrapped `localStorage.setItem`** — any write to a shared key is mirrored to
  the server via `PUT /api/kv/:key` (which merges per-item for list keys).
- **Durable retry queue** — every unconfirmed write is retried with exponential
  backoff (capped 30 s), **never gives up**, survives tab close (persisted in
  `__shph_unsynced__`), shows a red "unsaved" banner, and warns before unload.
- **Image offload** — base64 images are POSTed to `/api/img`, swapped for tiny
  `/img/<id>` refs before saving (keeps payloads small; images never lost).
- **`window.shphSetLocal(key, value)`** — writes localStorage WITHOUT triggering
  a whole-array push (used after a per-record server write, so the whole array
  isn't re-sent and can't clobber other records).
- **Quota handling** — if localStorage is full, it warns the user and still
  pushes to the server (data never silently dropped).
- **Corrupt-queue guard** — a corrupted retry queue is logged & cleared, not
  fatal.

---

## 8. Per-record write architecture (why data is safe)

Historically the app saved the **whole bookings array** on every change, which
let a stale browser overwrite newer data. Everything is now **per-record**:

| Server helper (`lib/store.js`) | What it does |
|---|---|
| `upsertOne(key, item)` | Transactional insert-or-replace of ONE item by `id`; offloads its images |
| `updateOneFresh(key, id, mutate)` | Transactional read-live-record → mutate one record → stamp `updatedAt` |
| `mergeListWrite(key, incoming)` | Transactional per-item merge of a whole array (used by `PUT /api/kv`) |
| `mergeById(stored, incoming)` | Last-write-wins **by `updatedAt`**, never un-deletes a tombstone |
| `backupList(key, merged)` | Rolling daily backup; never shrinks, never backs up empty |

**Concurrency safety comes from three rules:**
1. **Transactions read the LIVE document**, so two devices can't overwrite each other.
2. **`updatedAt` last-write-wins** per record — a stale copy (older stamp) loses.
3. **Soft-delete tombstones** (`deleted: true`) always win over an un-deleted stale copy.

**Collision-resistant IDs:** new records use `uid()` =
`Date.now()*1000 + random(0..999)` (a safe integer), so two browsers creating a
record at the same instant can't generate the same id and overwrite each other.

---

## 9. Server API reference (`server.js`)

| Method & path | Purpose |
|---|---|
| `GET /api/kv` | All shared data (used to seed pages) |
| `GET /api/kv/:key` | One key's current value |
| `PUT /api/kv/:key` | Write a key; **list keys are merged per-item** transactionally |
| `DELETE /api/kv/:key` | Reset a key |
| `POST /api/import` | Bulk import |
| `POST /api/img` | Store one photo → returns `{ url: "/img/<id>" }` |
| `GET /img/:id` | Stream a stored photo from Cloud Storage (or legacy Firestore) |
| `POST /api/list/:key` | Per-record **upsert** (`{upsert}`) or soft-**delete** (`{del}`) for a list key |
| `POST /api/booking/:id/patch` | Field-patch a booking (Object.assign onto live record) |
| `POST /api/booking/:id/payment` | Add / edit (`editIndex`) / delete (`deleteIndex`) one payment |
| `POST /api/booking/:id/deposit` | Set/clear security-deposit-return fields |
| `POST /api/booking/:id/ids` | Save guest ID photos for a booking |
| `POST /api/booking/:id/:action` | `cancel` / `reinstate` / `delete` (soft) |
| `GET /api/health` | JSON health snapshot (backend, bucket, record counts) |
| `GET /health` | Human-readable green/red health page |

**Pages** (server-rendered EJS, also available with/without `.html`):
`/` (index), `/havens`, `/booknow`, `/payment`, `/admin`, `/dashboard`,
`/todaysbooking`, `/Nicole`, `/payroll`, `/partner-login`, plus `/partners` &
`/partner-dashboard` (partner-branded dashboard).

---

## 10. Which action saves via which path (write catalog)

Every booking-touching action in `dashboard.html` is now per-record:

| Admin action | Endpoint used |
|---|---|
| Create / edit booking | `/booking/:id/patch` (edit) · `/api/list` upsert (create) |
| Upload / remove guest ID | `/booking/:id/ids` (saved instantly on upload) |
| Record / edit / delete a payment | `/booking/:id/payment` (`editIndex` / `deleteIndex`) |
| Approve / revert a payment | `/booking/:id/payment` (editIndex) |
| Replace / delete a payment photo | `/booking/:id/payment` (photo offloaded first) |
| Mark / undo deposit returned | `/booking/:id/deposit` |
| Refund toggle, approve/revert booking | `/booking/:id/patch` |
| Cancel / reinstate / reject booking | `/booking/:id/:action` (soft-delete) |
| Bills / Expenses / Havens / Users / Staff | `/api/list/:key` (upsert / soft-delete) |

Each first stamps + mirrors locally (durable), then fires the server write
(clobber-safe). Bills/expenses/haven images and booking proofs/IDs are offloaded
to Cloud Storage automatically.

---

## 11. Booking lifecycle (end to end)

**Guest path**
1. Guest browses `/havens`, picks dates on `/booknow` → handoff via
   `shph_pending_booking` in localStorage.
2. `/payment` creates the booking (unique id, friendly `SH-000x` number),
   attaches the downpayment proof photo, writes to `shph_bookings_v3`.

**Admin path (dashboard)**
1. Booking appears under **Booking Approval**; admin approves (`approved: true`).
2. Front desk manages the stay in **Today's Booking**; records payments
   (per-record), uploads guest IDs (per-record, offloaded).
3. On checkout, admin marks the **security deposit returned** (with photo) or
   handles refunds — all per-record.
4. Cancellations/deletes are **soft** (`deleted`/`cancelled` tombstones) — records
   are hidden but never physically erased, and can't be resurrected by a stale copy.
5. **Analytics** computes Gross → deductions (deposits returned, pool passes,
   towels, damages, refunds) → NET after bills & expenses.

---

## 12. Data-safety mechanisms (summary)

| Mechanism | Protects against |
|---|---|
| Per-record transactional writes | Concurrent overwrites / whole-array clobber |
| `updatedAt` last-write-wins | Stale copy beating a newer edit |
| Soft-delete tombstones | Deleted records resurrecting |
| Collision-resistant `uid()` ids | Two devices creating the same id |
| Image offload to Cloud Storage | Lost / oversized photos, payload bloat |
| Durable retry queue (seed-bridge) | Flaky network / tab close mid-save |
| Prime-merge on load | Unsynced local edits + re-pushing failed writes |
| Rolling `shph_backups` | Catastrophic corruption (daily restore points) |
| Cold-start hydrate never writes defaults | Data wipe on serverless cold start |
| Cross-tab `storage` listeners | Stale views across open tabs |
| Quota + corrupt-queue guards | Silent local-storage failures |

---

## 13. Build & deploy

1. Edit source `.html` (and `server.js` / `lib/store.js` / `public/*` as needed).
2. `node tools/build-views.js` → regenerates `views/*.ejs`, copies `/public`.
3. Commit to **`pia-side`**; **Vercel auto-deploys** that branch to production.
4. Live URL: **staycationhavenph.com**. (The `main` branch is a separate, older
   lineage — production runs `pia-side`.)

Required Vercel env vars: `FIREBASE_SERVICE_ACCOUNT` (JSON) and optionally
`FIREBASE_STORAGE_BUCKET`.

---

## 14. Health monitoring

- **`/health`** — a page that shows a big **green** banner when data is durable,
  or **red** with the exact fix if the service account or bucket is missing.
- **`/api/health`** — JSON: `{ backend, durable, project, images, bucket, counts }`.

Glance at `/health` after entering data; green = data and photos are safe on the
server.

---

## 15. Known residual risks (small)

- **Payment index race:** editing/deleting a payment uses its array index; if a
  *different device* concurrently changes the *same booking's* payments, the wrong
  payment could be targeted. Rare for a single-admin setup; no data is *lost*.
- **`todaysbooking.html` create** still uses the whole-array save (with a
  confirmation check) rather than per-record.
- **Backend fallback:** if the Firebase service account is ever removed, the
  server falls back to an ephemeral local file — `/health` turns red to warn you.

---

*This document reflects the system after the 2026-07 data-durability overhaul
(per-record writes across bookings, payments, IDs, deposits, bills, expenses,
havens). See `.claude` memory `system-audit-2026-07` for the change history.*

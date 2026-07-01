# StaycationHaven PH — Backend (Admin Dashboard) Reference

> Deep documentation of the **admin "backend"** — `dashboard.html` (~10.6k lines),
> the single-page app where all business management happens. For the overall
> system (server, database, sync), see [ARCHITECTURE.md](ARCHITECTURE.md).
> Last updated: 2026-07-01 (branch `pia-side`).

---

## 1. What the backend is

`dashboard.html` is a **single-page application (SPA)**: one big HTML file with
many hidden "pages" (sections) that are shown/hidden by `showPage()`. It reads &
writes business data through the durability layer (localStorage mirror +
per-record API), and renders everything client-side.

- **Served at:** `/dashboard` (and `/partners`, `/partner-dashboard` for partner mode).
- **Built from:** `dashboard.html` → `views/dashboard.ejs` via `node tools/build-views.js`.
- **Login:** `admin.html` sets `shph_current_user`; the dashboard reads it.

---

## 2. Navigation structure (sidebar)

Sections are grouped in the sidebar. Each item has a `data-page` key; clicking
calls `showPage(key)` (except **Today's Booking**, which links to the separate
`/todaysbooking.html` front-desk screen).

| Group | Item | Page key | Purpose |
|---|---|---|---|
| **Main** | Today's Booking | `today` | → `/todaysbooking.html` (front desk) |
| | Calendar/Bookings | `calendar` | Month/week calendar + bookings table |
| | Guest Form | `guestform` | Collect guest info/IDs for a booking |
| **Front Desk** | Booking Approval | `approval` | Approve/reject incoming (website) bookings |
| | Payment Approval | `paymentapproval` | Approve/revert recorded payments |
| | Security Deposit | `deposit` | Mark deposits returned / refunds |
| **Property** | Havens | `havens` | Manage listings (photos, price, amenities, order) |
| | Rates & Add-ons | `booking` | Pricing rules & add-on rates |
| | Housekeeping | `cleaners` | Cleaning reports + photos |
| **Finance** | Finance | `finance` | Revenue overview |
| | Payments | `payments` | Payment records |
| | Payroll | `payroll` | Staff pay computation |
| | Bills | `bills` | Bills payable (+ bill/receipt photos) |
| | Expenses | `expenses` | Operating expenses (+ receipts) |
| | Analytics | `analytics` | Gross → NET business analytics |
| **Team** | Users | `users` | Dashboard accounts + permissions |
| | Employees | `employees` | Employee records |
| | Assist | `assist` | Assist role tracking |
| | Log | `log` | Activity log |

**`showPage(page)`** (≈ line 6512): hides all sections, shows the chosen one,
updates the active nav item, and remembers the choice in
`localStorage["shph_dashboard_page"]` so a refresh returns to the same page.
Nav groups are collapsible (state persisted).

---

## 3. Permissions & partner mode

- **`DASH_PAGES`** (≈ line 10338): the master list of `{key, label}` pages used for
  permission checkboxes and labels.
- **Users** (`shph_users`) each have `perms: [pageKey…]` (or `admin:true` = all pages).
  On load the sidebar is `perms-pending` (hidden) until the user's permissions are
  resolved, then only permitted nav items show.
- **Partner mode:** when served at `/partners`, `window.__PARTNER__` is set
  (see `public/partners.js`). Non-super-admin partners are scoped to a single
  haven — bookings and analytics are filtered to `window.__PARTNER__.haven`, and
  some write functions are neutralised.

---

## 4. Data the backend manages (localStorage keys)

Each key mirrors a Firestore document (see ARCHITECTURE.md §5). In-memory arrays
in `dashboard.html`:

| Variable | localStorage key | Loader |
|---|---|---|
| `bookings` | `shph_bookings_v3` | `load()` (filters `!deleted`) |
| `listings` | `staycation_havens` | `loadHavens()` (sorted by `order`) |
| `bills` | `shph_bills_v1` | `loadBills()` |
| `expenses` | `shph_expenses_v1` | `loadExpenses()` |
| `staff` | `shph_staff_v1` | `loadStaff()` |
| `users` | `shph_users` | `loadUsers()` |
| cleaning | `shph_cleaning_v1` | `loadCleaning()` |
| settings | `shph_settings` | booking/payment settings |

---

## 5. The save logic (how the backend persists — critical)

Everything the backend saves is **per-record** (never a whole-array overwrite),
so a stale browser/tab can't clobber another's data. The shared helpers:

| Helper | What it does |
|---|---|
| `saveOneRecord(key, item)` | `POST /api/list/:key {upsert}` — insert/replace one record (offloads images) |
| `deleteOneRecord(key, id)` | `POST /api/list/:key {del}` — soft-delete one record |
| `setLocalKey(key, val)` | `window.shphSetLocal` — write localStorage **without** a whole-array push |
| `patchBooking(id, set)` | `POST /api/booking/:id/patch` — field-patch one booking on the live record |
| `_offloadImg(dataUrl)` | `POST /api/img` — turn a base64 photo into a durable `/img/<id>` ref |
| `_stampLocal(b)` | stamp `updatedAt` + refresh the booking's change signature |
| `_bkMirror(b)` | `_stampLocal` + `setLocalKey` (local durability + prime-merge safety net) |
| `bkSave(b, set)` | `_bkMirror` then `patchBooking` (used by toggles) |
| `bkPaymentEdit(b, idx)` | persist one edited payment (`POST /payment {editIndex}`) |
| `bkPaymentDelete(b, idx)` | persist a payment removal (`POST /payment {deleteIndex}`) |
| `uid()` | collision-resistant id: `Date.now()*1000 + random(0..999)` |

**The universal pattern for a save:**
1. Mutate the in-memory record.
2. `_bkMirror(b)` / `setLocalKey(...)` — stamp + mirror locally (so a failed
   server write is re-pushed by the load-time prime-merge via the durable queue).
3. Fire the matching per-record API call (reads the live record → no clobber).
4. Interactive saves also `alert()` + keep the modal open if the server rejects.

**Legacy (still present but no longer used for the whole array):**
`save(data)` and `confirmBookingSaved()` were the old whole-array writers — kept
defined but no `save(bookings)` calls remain.

---

## 6. Per-screen workflows & key functions

### Calendar / Bookings (`calendar`)
- **Render:** `renderAll()` → month/week calendar (`renderCalendar`) + the
  bookings table for the selected date range and haven filter.
- **Add/Edit booking modal:** `openModal(id)` / `saveBooking()`.
  - `saveBooking()` (≈ 6271) builds `data` from the form, validates guests/ages/
    capacity/double-booking, offloads proof photos, then:
    - **edit** → `patchBooking(id, patch)` (patch excludes `ids`/`idOptOut`/`payments`
      so they're preserved),
    - **create** → `saveOneRecord("shph_bookings_v3", rec)`,
    - **linked havens** (multi-haven stay) → one per-record booking each, tied by `groupId`.
  - Guard: `_savingBooking` (double-submit); `closeModal()` + `renderAll()` on success.
- **Guest IDs tab:** `renderIdGrid()`, `addIdsFromFiles()`, `removeId()` →
  `persistBookingIds()` saves the ID photos **immediately per-record**
  (`POST /booking/:id/ids`, offloaded) so they can't be lost.
- **Proof of Payment tab:** `applyProofFile`, `replaceCollectionProof`,
  `deleteCollectionPhoto` — each per-record via `/payment` (photos offloaded).
- **Status actions:** `bookingAction(id, action)` → `cancel` / `reinstate` /
  `delete` (soft). Deletes are tombstones (hidden, never erased).

### Booking Approval (`approval`)
- `renderApproval()` lists website bookings awaiting approval.
- `approveBooking(id)` → `bkSave(b, {approved:true})`.
- `revertApproval(id)` → `bkSave(b, {approved:false})`.
- `rejectBooking(id)` → soft-delete (mark `deleted` + `bookingAction(id,"delete")`).

### Payment Approval (`paymentapproval`)
- `renderPaymentApproval()` lists recorded payments.
- `approvePayment` / `revertPayment` → `bkPaymentEdit(b, idx)`.
- `deletePaymentRow` → `bkPaymentDelete(b, idx)` (+ clears `addonProof` if the
  last Add-Ons payment is gone).

### Security Deposit (`deposit`)
- `confirmDepReturn(id)` → offload refund photo → `POST /booking/:id/deposit {set}`
  (sets `depositReturned` + proof/refund fields). Guard: `_depSaving`.
- `undoDeposit(id)` → `POST /booking/:id/deposit {set/del}` to clear it.
- Only **returned** deposits count as a deduction in Analytics.

### Havens (`havens`)
- `renderListings()` (paged grid). `openHaven(i)` edit drawer.
- `saveHaven()` → `saveOneRecord("staycation_havens", item)` (preserves `order`).
- `addListing()` → per-record create with `order = end`.
- Drag-reorder: `onDrop()` reassigns `order` and saves each moved haven per-record;
  `loadHavens()` sorts by `order` so the site reflects it.
- Gallery upload: `hvUploadGallery()` (click/drag/paste, offloaded on save);
  main image + gallery photos become `/img` refs.

### Bills (`bills`) & Expenses (`expenses`)
- `saveBill()` / `toggleBillPaid()` / `deleteBill()` — per-record via `saveOneRecord`
  / `deleteOneRecord` on `shph_bills_v1`. Bill + receipt **photos** (drag/drop/paste)
  are offloaded automatically.
- `saveExpense()` / `deleteExpense()` — same pattern on `shph_expenses_v1`, with a
  receipt photo field.

### Payroll (`payroll`)
- `staff` records with nested `days[]` / `records[]`.
- `saveStaff` / `saveDay` / `saveRecord` — staff saved per-record on `shph_staff_v1`
  (nested day/record ids are local to a staff record).

### Users (`users`)
- `renderUsers()`, `saveUser()` (per-record on `shph_users`), `permsFor(u)`.
- Permissions drive which sidebar pages a user sees.

### Housekeeping (`cleaners`)
- `renderCleaners()`, `cleanPhoto()` (resize + attach), `saveCleanReport()` on
  `shph_cleaning_v1`.

### Analytics (`analytics`)
- `renderAnalytics()` — **Gross → NET** model:
  - **Gross** = collected revenue.
  - **Deductions (red):** returned security deposits, pool passes, towels,
    damages, refunds, housekeeping (₱100/booking).
  - **NET (after Bills & Expenses):** subtract pending bills + supplies/expenses.
  - Damages are treated as **admin income** (green), not partner cost.
  - Partner view shows a 3-KPI layout (Gross / Total Expenses / NET) + 12-month chart.

### Activity Log (`log`)
- `logActivity(text)` appends to `shph_activity_log` — every meaningful admin
  action is recorded. "Export" downloads a full JSON snapshot of all data.

---

## 7. Cross-tab & multi-device behaviour

- A `storage` event listener reloads `bookings` when another tab changes them and
  reseeds the change-signature baseline (`_seedBkSig`) so it isn't re-stamped.
- A second `storage` listener reloads **bills / expenses / staff / users / havens**
  so other open tabs don't show stale data (the haven grid is skipped while its
  edit drawer is open).
- On page load, `seed-bridge.js` prime-merges local + server so unsynced edits
  survive and failed writes get re-pushed.

---

## 8. Booking data shape (reference)

A booking in `shph_bookings_v3` looks roughly like:

```js
{
  id: 1770000000000123,          // uid() — collision-resistant
  bookingNo: "SH-0042",          // friendly number (website bookings)
  haven: "Casa Bienca",
  guests: [{ name, age }, …],
  contact, fbName, email,
  checkin, checkout, checkinTime, stayHours, slot,
  swimpass, towels, extend, holiday, deposit, discount, method,
  downpayment, total,
  downProof, addonProof, extendProof, balanceProof,   // "/img/<id>" refs
  ids: ["/img/<id>", …], idOptOut,                    // guest IDs (per-record)
  payments: [{ amount, category, mop, proof, approved, … }, …],  // per-record
  depositReturned, depositReturnProof, …              // per-record
  approved, cancelled, dpRefunded,
  updatedAt,                                          // last-write-wins stamp
  deleted, deletedAt,                                 // soft-delete tombstone
  groupId                                             // links multi-haven stays
}
```

Fields owned by their own per-record endpoints — `payments`, `ids`/`idOptOut`,
and deposit-return fields — are **never** included in a booking field-patch, so an
edit to one part can't wipe another.

---

## 9. Backend lifecycle (session)

1. **Load** → EJS injects live data → `seed-bridge` primes/merges localStorage →
   dashboard reads `bookings`/`listings`/etc. into memory → `renderAll()` +
   `showPage(remembered)`.
2. **Work** → each action mutates memory, mirrors locally (durable), fires a
   per-record API write, and re-renders.
3. **Sync** → per-record writes hit Firestore transactionally; failed ones are
   re-pushed on the next load; other tabs refresh via `storage` events.
4. **Safety net** → rolling backups (`shph_backups`), `/health` page, and the
   red "unsaved" banner from `seed-bridge` if anything is still pending.

---

## 10. Editing the backend safely

- Edit **`dashboard.html`** (not the generated `views/dashboard.ejs`).
- Run **`node tools/build-views.js`** to regenerate the view.
- New record ids must use **`uid()`** (never `Math.max(...ids)+1`).
- New saves should follow the **per-record pattern** (§5), not `save(bookings)`.
- Photos must be **offloaded** (`_offloadImg` / `/api/img`) before storing, so only
  `/img` refs live in the data.
- Commit to **`pia-side`** → Vercel auto-deploys. Check **`/health`** stays green.

---

*Companion to [ARCHITECTURE.md](ARCHITECTURE.md). Change history is in the
`.claude` memory `system-audit-2026-07`.*

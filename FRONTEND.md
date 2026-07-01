# StaycationHaven PH — Frontend (Public Guest Site) Reference

> Deep documentation of the **guest-facing frontend** — the public pages a
> customer uses to browse havens and book a stay. For the admin app see
> [BACKEND.md](BACKEND.md); for the whole system see [ARCHITECTURE.md](ARCHITECTURE.md).
> Last updated: 2026-07-01 (branch `pia-side`).

---

## 1. What the frontend is

The public marketing + booking site. Server-rendered EJS pages (seeded with live
haven data), plain client-side JavaScript, no framework. A guest moves through a
**4-step funnel** that ends by creating a real booking the admin then approves.

- **Served at:** `/` (index), `/havens`, `/booknow`, `/payment` (also `.html`).
- **Built from:** `index.html`, `havens.html`, `booknow.html`, `payment.html`
  → `views/*.ejs` via `node tools/build-views.js`.
- Shares the same durability layer as the backend: every page includes
  `seed-bridge.js`, so any write to a shared key syncs to the server.

---

## 2. The guest booking funnel

```
  index.html            havens.html              booknow.html            payment.html
 ┌───────────┐   pick  ┌────────────┐   book    ┌────────────┐  confirm ┌────────────┐
 │  Home /   │ ──────► │  Haven      │ ────────► │  Review &  │ ───────► │  Payment & │
 │  listings │  haven  │  detail +   │  dates/   │  guest     │  guest   │  proof →   │
 │           │         │  configurator│  add-ons │  details   │  info    │  CREATE    │
 └───────────┘         └────────────┘           └────────────┘          └─────┬──────┘
                            │                         │                        │
                writes shph_pending_booking   writes shph_confirmed_booking    ▼
                (localStorage handoff)         (localStorage handoff)   shph_bookings_v3
                                                                        (real booking, id + SH-000x)
```

The two `localStorage` **handoff keys** carry the in-progress booking between
pages; the final booking is written to `shph_bookings_v3` on the payment page and
the handoff keys are cleared.

| Handoff key | Written by | Read by | Meaning |
|---|---|---|---|
| `shph_pending_booking` | `havens.html` (`bookNow()`) | `booknow.html` | Chosen haven + dates + add-ons |
| `shph_confirmed_booking` | `booknow.html` | `payment.html` | Above + guest details/IDs |
| `shph_bookings_v3` | `payment.html` | (whole system) | The **real** booking record |

---

## 3. Pages & key functions

### `index.html` — Home
- Marketing landing page. Renders haven cards from **`loadHavens()`** (≈ line 173),
  so any haven the admin adds/edits/reorders in the backend shows here
  automatically (sorted by the admin-set `order`).
- Links into `havens.html` for a specific haven.

### `havens.html` — Haven detail + booking configurator
- **`loadHavens()`** / **`getHaven(id)`** (≈ 74, 94) — load the haven(s) to display
  (photos, price, amenities, gallery).
- **Availability:** reads existing bookings (`loadBookings()`, ≈ 339) and computes
  the haven's occupied intervals — `currentHavenBookings()` (≈ 697),
  `bookingAbsInterval()` / `bookingStartMin()` / `bookingDurationMin()` (≈ 680-697)
  — to block already-booked dates/times (including a cleaning gap).
- **Pricing:** **`computeBooking()`** (≈ 465) calculates the total from the stay
  length, add-ons (pool pass, towels, extra hours), holiday surcharge
  (`bookingHasHoliday()`, ≈ 443), and the rate settings.
- **`syncBooking()`** (≈ 793) keeps the on-screen selection consistent.
- **`bookNow()`** (≈ 1113) — validates the selection, builds the `booking` object,
  writes it to **`shph_pending_booking`** (≈ 1180), and navigates to `booknow.html`.

### `booknow.html` — Review & guest details
- Reads **`shph_pending_booking`** (≈ 210) and **`renderBooking()`** (≈ 229) shows
  the summary (haven, dates, add-ons, total).
- Collects **guest details** (names/ages) and optionally **guest ID photos**
  (drag/drop/paste; displayed from `c.ids`).
- On confirm, writes the enriched booking to **`shph_confirmed_booking`** (≈ 501)
  and continues to `payment.html`.

### `payment.html` — Payment & booking creation
- Reads **`shph_confirmed_booking`** (≈ 264) and shows the amount + **payment
  instructions** (GCash/bank/QR, pulled from `shph_settings` via `site-settings.js`).
- Guest uploads a **downpayment proof** photo.
- On submit, **creates the real booking** (`writeBooking`, ≈ 210-261):
  1. **De-dupe:** if a matching website booking already exists (same haven +
     check-in + contact), returns it instead of creating a duplicate.
  2. **Conflict guard:** `bookingConflicts(arr, b)` (≈ 169) refuses a booking that
     clashes with an existing one.
  3. **Create:** assigns a **collision-resistant id**
     (`Date.now()*1000 + random`) and a friendly **`bookingNo` = `SH-000x`**
     (sequential display number), sets `source: "website"`, attaches the proof,
     and `localStorage.setItem("shph_bookings_v3", …)` (≈ 261) — which
     `seed-bridge.js` mirrors to the server (per-item merge).
  4. **Cleanup:** clears both handoff keys (≈ 400-401).
- The new booking now appears in the backend under **Booking Approval**.

---

## 4. Data the frontend uses

| Source | Via | Used for |
|---|---|---|
| `staycation_havens` | `loadHavens()` / `getHaven()` (`havens-data.js`) | Listings, photos, price, amenities |
| `shph_settings` | `site-settings.js` | Rates, add-on prices, payment methods/QR |
| `shph_bookings_v3` | `loadBookings()` | Availability checks; the created booking |
| `shph_pending_booking` | localStorage | Handoff: havens → booknow |
| `shph_confirmed_booking` | localStorage | Handoff: booknow → payment |

Because pages are seeded server-side and `seed-bridge.js` primes localStorage,
`loadHavens()` and availability checks always reflect **live, shared** data.

---

## 5. Shared client assets

| File (`/public`) | Role |
|---|---|
| `havens-data.js` | `DEFAULT_HAVENS`, `loadHavens()` (sorted by `order`), `getHaven()`, `saveHavens()` |
| `site-settings.js` | Booking rates & payment settings (rates, QR, methods) |
| `db.js` | Legacy `DB.*` API (LocalAdapter, localStorage-only) — thin data helper |
| `script.js` | Shared UI helpers / interactions |
| `style.css` | Site styling |
| `js/seed-bridge.js` | Hydration + durable sync (same as backend) |
| `amenity-icons.js` | Amenity icon mapping |

---

## 6. How a guest booking becomes durable

The frontend writes the booking to `shph_bookings_v3` via `localStorage.setItem`,
which `seed-bridge.js` intercepts and:
1. **Offloads** the proof photo (base64) to Cloud Storage → tiny `/img/<id>` ref.
2. **Queues** a `PUT /api/kv/shph_bookings_v3` that the server merges **per item**
   (transactional) — so a guest booking can't overwrite existing bookings.
3. **Retries forever** on a flaky connection (durable queue), warns before unload
   if still unsaved.

So even a guest on poor mobile data won't lose their booking.

---

## 7. Availability & pricing logic (frontend)

- **Availability** is computed on the client from the current bookings for that
  haven: each booking's absolute time interval (start + duration + cleaning gap)
  marks slots unavailable, so guests can't pick an occupied window.
- **Pricing** (`computeBooking()`) = base stay price (by hours/slot) + pool passes
  + towels + extra hours + holiday surcharge − any rules in `shph_settings`.
- The **payment page re-checks** conflicts server-consistently before creating the
  booking (`bookingConflicts`), and **de-dupes** so a double-submit or refresh
  doesn't create two bookings.

---

## 8. Frontend lifecycle (a booking)

1. **Browse** — guest opens `/` or `/havens`; live havens render via `loadHavens()`.
2. **Configure** — picks haven, dates, add-ons; price + availability computed live;
   `bookNow()` → `shph_pending_booking`.
3. **Review** — `/booknow` shows the summary; guest adds details/IDs →
   `shph_confirmed_booking`.
4. **Pay** — `/payment` shows instructions; guest uploads proof; on submit the real
   booking is created in `shph_bookings_v3` (unique id, `SH-000x`, `source:website`)
   and handoff keys are cleared.
5. **Handover** — booking appears in the backend's **Booking Approval**; admin
   approves, records payments, collects IDs, and manages the stay (see BACKEND.md).

---

## 9. Editing the frontend safely

- Edit the source `.html` (`index/havens/booknow/payment.html`), not the generated
  `views/*.ejs`.
- Run **`node tools/build-views.js`** to rebuild the views + copy `/public` assets.
- New booking ids must stay **collision-resistant** (`Date.now()*1000 + random`),
  never `Math.max(...ids)+1`.
- Keep the friendly `SH-000x` number **separate** from the internal id.
- Photos must go through the offload path (base64 → `/img` ref) so they're durable.
- Commit to **`pia-side`** → Vercel auto-deploys; verify at **`/health`**.

---

*Part of the docs set: [ARCHITECTURE.md](ARCHITECTURE.md) (whole system),
[BACKEND.md](BACKEND.md) (admin dashboard), FRONTEND.md (this — guest site).*

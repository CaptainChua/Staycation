# Staycation Haven PH — Partnership Module Workflow

End-to-end workflow for the MVP partnership module. Use this as the reference for how partners, admins, CSRs, and guests interact with the system.

---

## Table of contents

1. [System overview](#system-overview)
2. [User roles](#user-roles)
3. [Partner workflow](#1-partner-workflow)
4. [Admin (Superadmin) workflow](#2-admin-superadmin-workflow)
5. [Guest (Customer) workflow](#3-guest-customer-workflow)
6. [CSR workflow](#4-csr-customer-service-workflow)
7. [Background jobs](#5-background-jobs)
8. [Data flow](#data-flow)
9. [State machines](#state-machines)
10. [Business rules](#business-rules)
11. [Deployment checklist](#deployment-checklist)

---

## System overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    STAYCATION HAVEN PH                           │
│  Multi-tenant short-stay rental marketplace (Philippines)        │
└──────────────────────────────────────────────────────────────────┘

         GUESTS ──► PARTNERS ──► OWNERS/CSRs/CLEANERS
         (book)    (supply)      (operate the platform)

Stack: Next.js 16 · React 19 · TypeScript · PostgreSQL (Neon) ·
       NextAuth · RTK Query · Tailwind · NextUI · Cloudinary ·
       Vercel Cron
```

---

## User roles

| Role | Auth source | Lands at | What they can do |
|---|---|---|---|
| **Guest** | `users` table (OAuth or signup) | `/`, `/rooms` | Browse, book, message |
| **Partner** | `partners_account` | `/admin/partners` | Submit havens, view analytics, manage calendar, see payouts |
| **Owner (Superadmin)** | `employees` role=Owner | `/admin/owners` | Approve everything, manage payouts, override anything |
| **CSR** | `employees` role=CSR | `/admin/csr` | Review payments/deposits, assign cleaners |
| **Cleaner** | `employees` role=Cleaner | `/admin/cleaners` | Execute cleaning tasks |

Login flow checks **employees → partners_account → users** in that order. JWT carries the role.

---

## 1. Partner workflow

### Step 1 — Sign up
- Visit `/partner/signup`
- Fill: email, password, full name, phone, business name (optional), address
- Submit → POST `/api/auth/partner-register` → creates `partners_account` (status: `pending`) + `partners_information`
- Redirected to login

### Step 2 — Log in
- Visit `/admin/login` → enter credentials
- Allowed while pending (so partner can finish onboarding)
- Blocked if `suspended`, `rejected`, or `inactive`

### Step 3 — See status banner
- Every page shows: **"Your account is awaiting approval"**
- Banner has button: "Open onboarding"

### Step 4 — Complete onboarding (sidebar → Onboarding)
Required checklist (5 items):
- [x] **Basic info** — name, phone (auto-filled from signup)
- [x] **Address** — street, city, province, postal code
- [x] **Valid ID** — upload to Cloudinary (passport / driver's license / national ID / etc.)
- [x] **Signed contract** — download blank → sign → upload to Cloudinary
- [x] **Payout details** — GCash number / Maya / Bank (at least one)

Optional:
- Tax info (TIN, registered name)

Status: `ready_for_review` when all 5 done.

### Step 5 — Wait for admin approval
- Admin reviews docs in their portal
- On approval: `partners_account.status = 'active'`
- Banner disappears, full access unlocked

### Step 6 — Add room (sidebar → Add room)
8-step wizard:

| Step | What's captured |
|---|---|
| 1. Basic Info | Haven name, Location, Specific Details, Nearby areas |
| 2. Pricing | Dynamic rates (label + hours + price), max 24h per rate |
| 3. Check-in | Auto-derived per rate; partner can adjust each |
| 4. Details | Capacity, Room size (sqm), Bedrooms, **Bathrooms**, **Property Type**, Description, **Cleaning Fee**, Security Deposit, Extra Pax Fee, House Rules, Smoking/Pet/Cancellation policies, Google Map address, Virtual Tour URL |
| 5. Amenities | Built-in toggles + custom amenity creation (icon auto-detect or upload) + category (Essential/Comfort/Luxury/Safety/Rentable) |
| 6. Images | Cover photos (Cloudinary) |
| 7. Photo Tour | Per-category photos (living/bedroom/kitchen/bathroom/dining/exterior/pool/garage/additional) |
| 8. Video URL | YouTube embed URL |

On save:
- `havens` row created with `partner_id` = current partner
- DB trigger creates `property_approval` row with `status='pending'`
- `haven_amenity_verifications` rows auto-created (one per selected amenity, status='pending')
- Haven is **NOT public** until admin approves

### Step 7 — Verify amenities (sidebar → Verify amenities)
- For each amenity submitted, upload **proof** (photo, video, or screenshot)
- Add **notes** for the reviewer (optional)
- Status workflow:
  ```
  pending → admin reviews → verified | rejected | revision_requested
                                              ↓
                                  partner re-uploads → back to pending
  ```
- Only **verified** amenities appear on the public marketplace

### Step 8 — Manage calendar (sidebar → Calendar)
- Pick a listing from chips
- Visual month grid with color-coded statuses:
  - 🟢 Available
  - 🟡 Blocked by partner
  - 🟣 Maintenance
  - 🔵 Imported from external platform (Airbnb/Booking.com)
  - 🟢 Booked
  - 🔴 Blocked by admin
- Click an available date → start range → click another date → confirm block (with reason)
- Click a blocked cell → confirms unblock
- **iCal sync panel** (right side):
  - Add external feed (Airbnb / Booking.com / Agoda / VRBO / other)
  - Paste their iCal URL → auto-syncs every 15 min
  - "Sync now" button for manual trigger
  - "Your export URL" — copy and paste into Airbnb/Booking.com so they block dates booked here

### Step 9 — Dashboard
- Calendar overview widget (next 14 days, color strip)
- Stat cards (Total/Active/Pending units, bookings, earnings)
- Notifications + recent activity (real, no mocks)
- Quick actions (Add room, View listings, See analytics, Cost breakdown)
- Tier progress bar (50 bookings to Premium)

### Step 10 — When a booking lands
- Guest pays through Staycation flow
- CSR approves payment
- Booking goes through: `pending → approved → confirmed → checked-in → completed`
- Partner sees status on Analytics + Cost Breakdown

### Step 11 — Get paid
- Admin generates payout for the partner over a date range
- System picks **completed bookings** in that range, applies commission, creates line items
- Admin marks **Paid** and uploads proof (Cloudinary)
- Partner sees in **Cost Breakdown**:
  - Line-by-line earnings per booking (gross, platform deduction, your share, net)
  - Payout history with proof links
  - Pending / Paid totals

### Step 12 — Get notified
- Notifications in topbar bell
- Booking lifecycle emails (confirmation, check-in reminder, checkout)
- Settings → Notifications (per-channel toggles, currently localStorage)

---

## 2. Admin (Superadmin) workflow

Owner Portal sidebar → **Partner Management** → 9 tabs:

### Tab 1 — Overview
- Aggregate stats across all partners

### Tab 2 — Listings
- Master-detail view of every partner's rooms
- **Disable / Re-enable** button per room → instantly removes from public marketplace without rejecting the partner
- **Edit Room** opens the full HavenFormModal wizard
- Status pills: Live / Pending / Rejected

### Tab 3 — Pending Requests
- Haven submission queue (status='pending' in `property_approval`)
- Review drawer shows: photos, partner info, all haven details
- **Approve** → status='approved', haven goes public
- **Reject with reason** → partner sees reason, can resubmit

### Tab 4 — Messages
- Partner ↔ staff chat threads
- Reply as staff

### Tab 5 — Docs & Analytics
- Revenue distribution allocation breakdown

### Tab 6 — Verifications (Amenities)
- Queue of every amenity verification across all partners
- Filter by status: Pending / Revision / Rejected / Verified / All
- Review modal shows: partner notes, proof gallery (clickable), internal reviewer notes input
- Actions: **Verify** / **Reject** / **Request Revision** (reject + revision require a reason)
- Optional: set reverification date

### Tab 7 — Payouts
- Queue of all partner payouts
- Filter by status: Pending / Processing / Paid / Failed / All
- **Generate Payout** modal:
  - Pick partner
  - Set cycle date range
  - Optional scheduled date
  - Pick method (GCash / Maya / Bank) + destination
  - Add deductions (label + amount)
  - System pulls eligible completed bookings → applies commission → creates payout + line items
- **Detail modal**:
  - See every booking that contributed
  - Enter reference number
  - Upload proof of payment
  - Actions: Cancel / Mark Processing / Mark Failed / **Mark Paid** (proof required)
  - On Mark Paid → partner's `total_paid` bumps

### Tab 8 — Approvals (Partners)
- Partner application queue
- Filter by status: Pending / Approved / Suspended / Rejected / All
- Row shows: name, business, doc completeness indicators (ID / Contract / Payout)
- Review modal shows side-by-side:
  - Profile (business, phone, address)
  - Documents (ID + Contract with View buttons)
  - Payout details (GCash / Maya / Bank)
  - Tax info
- Actions: **Approve** / **Reject with reason** / **Suspend with reason** / **Reactivate**

### Tab 9 — Audit Logs
- Every state change across partners, amenities, payouts, havens
- Filter by entity_type chips, action search, actor email search
- Expandable rows show full metadata (before/after, reason, IP)

---

## 3. Guest (Customer) workflow

### Step 1 — Browse marketplace
- Visit `/rooms`
- See only:
  - **Approved** havens (`property_approval.status='approved'`)
  - **Non-disabled** havens (`listing_status='active'`)
  - **Verified amenities** only in filter chips

### Step 2 — Filter
- Price range
- Capacity (pax)
- Amenities (multi-select, **only verified ones available**)
- Rating
- Location (tower / address contains)
- Sort: Recommended / Price low→high / Price high→low / Rating / Capacity

### Step 3 — View room detail
- `/havens/[id]`
- See: real photos, verified amenities, rates, cleaning fee, security deposit, policies, virtual tour link, location, beds, bathrooms

### Step 4 — Select dates
- Frontend checks `blocked_dates` + existing `booking` rows
- Conflicting dates marked unavailable
- Free dates selectable

### Step 5 — Book and pay
- `/checkout`
- Fill guest info
- Upload payment proof (GCash / bank)
- `booking.status='pending'`, `booking_payments.status='pending_down_payment'`

### Step 6 — Wait for confirmation
- Email when CSR approves
- See booking in `/my-bookings`

---

## 4. CSR (Customer Service) workflow

CSR Portal sidebar → key pages:

### Payments page
- Table of every booking_payment filtered by status
- Bulk actions:
  - **Approve** → applies `collect_amount`, status → `approved_down_payment`
  - **Reject** with reason → email sent to guest, status → `rejected`
- Card view + table view
- Pagination

### Deliverables page
- Add-on items (towels, pool pass, etc.) per booking
- Bulk: Preparing / Delivered / Cancelled / Refunded
- Tracks delivery status separately

### Calendar page
- View bookings on a calendar
- Manage reservations

### Reservations page
- Search bookings
- Status updates

CSR **cannot**:
- Approve units
- Edit payout settings
- Modify commission structures

---

## 5. Background jobs

### Vercel Cron — iCal sync (every 15 min)

```
*/15 * * * *  →  GET /api/cron/sync-icals
```

For each row in `haven_ical_feeds` where `is_active=true`:
1. Fetch the iCal URL
2. Parse VEVENTs
3. Upsert into `blocked_dates` with `external_source` + `external_uid`
4. Delete previously-imported events no longer in the feed (handles cancellations)
5. Update `last_synced_at` + status

Auth: requires `Authorization: Bearer $CRON_SECRET` in production (Vercel Cron sends this automatically).

---

## Data flow

```
                          ┌─────────────────┐
                          │  audit_logs     │  (append-only)
                          │  every action   │
                          └────────▲────────┘
                                   │
   Partner ─ register ──► partners_account ─────► partners_information
                                   │                       │
                                   │ status='active'       │
                                   ▼                       │
                              havens (pending)             │
                                   │                       │
                          property_approval ◄──── DB trigger
                                   │                       │
                          haven_amenity_verifications      │
                                   │                       │
                          blocked_dates ◄── iCal sync      │
                                   │                       │
                              booking ──► booking_payments │
                                   │                       │
                                   ▼                       │
                      partner_payouts ◄─── commission engine
                                   │
                          partner_payout_items
                                   │
                          partners_information.total_paid ↑
```

---

## State machines

### Partner account
```
pending  ──approve──►  active  ──suspend──►  suspended  ──reactivate──►  active
   │                      │
   │                      └──reject──►  rejected
   └────reject──►  rejected
```

### Haven approval
```
pending  ──approve──►  approved  (goes public)
   │
   └──reject(reason)──►  rejected  (partner can resubmit)
```

### Haven listing status (admin override)
```
active  ──disable(reason)──►  disabled  (hidden from marketplace)
   │                              │
   └──suspend(reason)──►  suspended  ──re-enable──►  active
```

### Amenity verification
```
pending  ──verify──►  verified  (appears publicly)
   │
   ├──reject(reason)──►  rejected
   │
   └──request_revision(reason)──►  revision_requested
                                          │
                                          └─partner re-uploads─► pending
```

### Booking
```
pending  ──approve──►  approved  ──confirmed──►  checked-in  ──►  completed
   │                                                              │
   │                                                              ▼
   └──cancel/reject──►  cancelled                          payout eligible
```

### Booking payment
```
pending_down_payment ──approve──►  approved_down_payment ──►  pending_full_payment
                                                                  │
                                                                  ▼
                                                       approved_full_payment
       │
       └──reject──►  rejected  ──►  refunded
```

### Security deposit
```
pending ──►  held ──►  returned (or partial / forfeited)
```

### Partner payout
```
pending  ──mark_processing──►  processing  ──mark_paid(+proof)──►  paid
   │                              │
   │                              └──mark_failed──►  failed
   └──cancel──►  cancelled
```

### Cleaning
```
pending ──assign──►  assigned ──start──►  in-progress ──finish──►  cleaned ──inspect──►  inspected
```

---

## Business rules

The 8 business rules from the spec, and how each is enforced:

| # | Rule | Enforcement |
|---|---|---|
| 1 | No unit becomes public without admin approval | `getAllHavens` filters `WHERE property_approval.status='approved'` |
| 2 | No amenity becomes public without verification | `getAllHavens` exposes only `verified_amenities`; filter chips read this |
| 3 | Prevent double-booking | `blocked_dates` merges manual blocks + iCal imports + bookings; availability check respects all 3 |
| 4 | Calendar sync auto-blocks | Vercel Cron `*/15 * * * *` upserts external events into `blocked_dates` |
| 5 | Partners only access own records | Every `/api/partners/me/*` route checks `getPartnerIdFromSession()` + joins on `partner_id` |
| 6 | Superadmin full override control | Admin Approvals + Listings + Disable + Verifications + Payouts + Audit tabs |
| 7 | Financial computations logged + auditable | Payout line items + `audit_logs` for every state change |
| 8 | Every booking & payout has timestamps + history | `created_at`, `updated_at`, `paid_at`, `payout_settled_at`, `reviewed_by`, `audit_logs` |

---

## Deployment checklist

### Database (Neon SQL Editor)
Run all migrations in `backend/models/` in chronological order:
1. ✅ `2026-05-20-havens-rates-jsonb.sql`
2. ✅ `2026-05-20-amenity-verifications.sql`
3. ✅ `2026-05-20-calendar-and-ical-sync.sql`
4. ✅ `2026-05-20-revenue-share-payouts.sql` (or `-RERUN.sql` / `-FIX-payout-items-columns.sql`)
5. ✅ `2026-05-20-partner-registration-hardening.sql`
6. ✅ `2026-05-20-property-fields-and-audit-logs.sql`
7. ✅ `2026-05-20-critical-mvp-fields.sql`

### Vercel environment variables
- `DATABASE_URL` — Neon connection string
- `NEXTAUTH_SECRET` — random long string for session signing
- `NEXTAUTH_URL` — production URL
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google OAuth)
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` (Facebook OAuth)
- `EMAIL_USER`, `EMAIL_PASSWORD` (Gmail App Password for Nodemailer)
- `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (Cloudflare bot protection)
- `CRON_SECRET` — random long string for iCal sync cron auth
- `GOOGLE_SHEETS_*` (if using Sheets sync)
- `OPENWEATHER_API_KEY` (if using weather widget)

### Vercel cron
Already configured in `vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/sync-icals", "schedule": "*/15 * * * *" }] }
```

### Smoke test (17 steps end-to-end)

```
[Partner side]
1. /partner/signup → create "test1@example.com"
2. /admin/login → see "Awaiting approval" banner
3. Sidebar → Onboarding → upload ID, contract, GCash → Save
4. Sidebar → Add room → BLOCKED with "still pending approval" ✅

[Admin side]
5. Owner portal → Partners → Approvals → see test1
6. Click Review → see uploads → Approve

[Partner side]
7. Banner disappears
8. Add room → fill 8 steps → Save → status=pending

[Admin side]
9. Partners → Pending Requests → Approve the haven
10. Verifications tab → Verify each amenity

[Public side]
11. /rooms → new room appears with verified amenities only

[Calendar test]
12. Partner Calendar → block a date manually
13. /rooms → click haven → confirm date unavailable

[Payout test]
14. Manually mark a test booking as completed in DB
15. Admin → Payouts → Generate for partner with cycle covering it
16. Mark as paid, upload proof image
17. Partner → Cost Breakdown → payout appears with proof link
```

---

## File reference

### Key backend files
- `backend/utils/auditLog.ts` — append-only audit logger
- `backend/utils/icalSync.ts` — iCal fetch + parse + upsert
- `backend/utils/bookingBreakdown.ts` — commission resolution engine
- `backend/utils/amenityVerifySync.ts` — keeps verifications in sync with amenities JSONB
- `backend/utils/partnerSession.ts` — session-scoped partner ID extraction
- `backend/controller/roomController.ts` — haven CRUD with status gates

### Key frontend files
- `Components/admin/Partners/PartnerShell.tsx` — partner portal layout + sidebar + status banner
- `Components/admin/Partners/pages/PartnerOnboardingPage.tsx` — onboarding checklist
- `Components/admin/Partners/pages/PartnerCalendarPage.tsx` — calendar + iCal feeds
- `Components/admin/Partners/pages/VerifyAmenitiesPage.tsx` — amenity proof uploads
- `Components/admin/Partners/pages/CostBreakdownPage.tsx` — earnings + payouts
- `Components/admin/Owners/PartnerManagementPage.tsx` — admin tabs container
- `Components/admin/Owners/PartnerApprovalsTab.tsx` — partner approval queue
- `Components/admin/Owners/AmenityVerificationsTab.tsx` — amenity review queue
- `Components/admin/Owners/PayoutsTab.tsx` — payout management
- `Components/admin/Owners/SystemAuditLogsTab.tsx` — audit log viewer
- `Components/admin/Owners/Modals/HavenFormModal.tsx` — 8-step haven wizard
- `app/partner/signup/page.tsx` — public partner signup

### Key API routes
- `app/api/auth/partner-register/` — public partner signup
- `app/api/partners/me/registration/` — partner onboarding GET/PATCH
- `app/api/partners/me/amenity-verifications/` — verification uploads
- `app/api/partners/me/listings/[havenId]/calendar/` — calendar GET/POST/DELETE
- `app/api/partners/me/listings/[havenId]/ical-feeds/` — iCal feed management
- `app/api/partners/me/earnings/` — per-booking breakdown
- `app/api/partners/me/payouts/` — payouts with line items
- `app/api/admin/partner-approvals/[id]/` — approve/reject/suspend partner
- `app/api/admin/amenity-verifications/[id]/` — verify/reject amenity
- `app/api/admin/partner-payouts/[id]/` — payout status + proof upload
- `app/api/admin/haven-listing-status/[havenId]/` — disable/suspend listing
- `app/api/admin/haven-commission/[havenId]/` — commission config
- `app/api/admin/system-audit-logs/` — audit log queue
- `app/api/cron/sync-icals/` — Vercel Cron entrypoint
- `app/api/haven/[id]/ical-export/` — public iCal export per haven

---

## What's NOT in MVP (deferred per spec)

- Google Map pin picker (Leaflet) — text address only
- Unit video upload — photos + virtual tour URL only
- Draft state for units — pending/approved/rejected only
- Request Revision for unit approval (amenities have it; havens use reject + reason)
- Admin "Edit Listing on partner's behalf" UI
- Admin Override Pricing / Override Availability UI (backend supports it)
- Pending Booking as distinct calendar status (shows as Booked)
- Per-haven commission config UI in HavenFormModal (admin uses API)
- Auto-scheduled payout cron (admin generates manually)
- Reverify-amenity cron (admin sets date, no auto-flip)
- Email automation on partner approval

Explicitly future per spec ("FUTURE EXPANSION READY"): Mobile App, Dynamic Pricing AI, AI Chat Support, Automated Guest Messaging, Smart Lock Integration, SMS Notifications, OTA API Integrations, Maintenance Ticketing.

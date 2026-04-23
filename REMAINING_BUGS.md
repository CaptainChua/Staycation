# Remaining Errors & Broken Features

> Last updated: 2026-04-14
> Previously fixed bugs (double booking, pool leak in reviews, auth signIn catch, delete-account table names, duplicate COMMIT, getBookingById params, removeConsole) are **not** listed here.

---

## CRITICAL — Will crash or break at runtime

### 1. `pdf.roundedRect()` doesn't exist in jsPDF

| | |
|---|---|
| **Files** | `app/api/generate-receipt-pdf/route.ts` — lines 123, 134, 229, 422, 441, 461 |
| | `app/api/send-pending-email/route.ts` — lines 53, 63, 146, 268, 281 |
| **Impact** | PDF receipt generation and pending email with PDF attachment are completely broken |

jsPDF has no `.roundedRect()` method. Every call throws:
```
TypeError: pdf.roundedRect is not a function
```
The correct jsPDF method is `.rect()`. Rounded corners require drawing manually or using a plugin.

---

### 2. `getServerSession()` called without `authOptions` — profile update always returns 401

| | |
|---|---|
| **File** | `app/api/profile/update/route.ts` — line 8 |
| **Impact** | Profile editing is completely broken for all users |

```ts
// ❌ Wrong — always returns null in App Router
const session = await getServerSession();

// ✅ Fix
const session = await getServerSession(authOptions);
```

`getServerSession()` without `authOptions` always returns `null` in Next.js App Router, so the session check always fails and every profile update returns `401 Unauthorized`.

---

### 3. Wrong table name `staff_activity_logs` — table does not exist

| | |
|---|---|
| **Files** | `backend/controller/employeeController.ts` — line 442 |
| | `backend/controller/activityLogController.ts` — line 447 |
| **Impact** | Employee login activity logging silently fails; delete-log endpoint always throws SQL error |

The real table name is `employee_activity_logs`. These queries reference `staff_activity_logs` which does not exist in the database schema.

```ts
// ❌ Wrong
INSERT INTO staff_activity_logs (employment_id, action_type, action, details, created_at)

// ✅ Fix — use correct table and correct columns
INSERT INTO employee_activity_logs (employee_id, activity_type, description, created_at)
```

---

## HIGH — Feature broken or data silently not saved

### 4. Profile update ignores `phone`, `address`, `city`, `country` fields

| | |
|---|---|
| **File** | `app/api/profile/update/route.ts` — lines 30–38 |
| **Impact** | Phone, address, city, and country are accepted in the request but never written to the database |

The UPDATE query only sets `name`. All other fields are silently discarded even though the frontend sends them.

```ts
// ❌ Current query — only saves name
UPDATE users SET name = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $1

// ✅ Fix — include all fields
UPDATE users SET name = $2, phone = $3, address = $4, city = $5, country = $6,
    updated_at = CURRENT_TIMESTAMP WHERE email = $1
```

---

### 5. 11 API routes create `new Pool()` per-request — connection pool exhaustion

| | |
|---|---|
| **Files** | `app/api/report/route.ts` — line 5 |
| | `app/api/report/submit/route.ts` — line 7 |
| | `app/api/report/[reportId]/route.ts` — line 7 |
| | `app/api/notifications/route.ts` — line 6 |
| | `app/api/admin/cleaners/[employeeId]/performance/route.ts` — line 4 |
| | `app/api/admin/cleaners/[employeeId]/assignment-stats/route.ts` — line 4 |
| | `app/api/admin/cleaners/[employeeId]/dashboard-stats/route.ts` — line 4 |
| | `app/api/admin/cleaners/[employeeId]/work-history/route.ts` — line 4 |
| | `app/api/admin/cleaners/[employeeId]/achievements/route.ts` — line 4 |
| | `app/api/admin/cleaners/[employeeId]/schedule-stats/route.ts` — line 4 |
| | `app/api/admin/cleaners/[employeeId]/assignments-today/route.ts` — line 4 |
| **Impact** | Under load, exhausts Neon's serverless connection limit and causes all DB queries to fail |

Each of these files creates its own pool instead of reusing the shared one:

```ts
// ❌ Wrong — creates a new pool on every request
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ✅ Fix — use the shared pool
import pool from '@/backend/config/db';
```

---

### 6. `getUserBookings` returns duplicate rows for multi-guest bookings

| | |
|---|---|
| **File** | `backend/controller/bookingController.ts` — lines 1378–1382 |
| **Impact** | Any booking with 2+ guests appears multiple times in the user's "My Bookings" page |

The query LEFT JOINs `booking_guests` without filtering to the primary guest. A booking with 3 guests produces 3 duplicate rows in the result.

```sql
-- ❌ Wrong — no filter on booking_guests, causes fan-out
LEFT JOIN booking_guests bg ON b.id = bg.booking_id

-- ✅ Fix — join only the primary guest
LEFT JOIN booking_guests bg ON b.id = bg.booking_id
  AND bg.id = (SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1)
```

---

## MEDIUM — Wrong behaviour or data integrity issue

### 7. Phone validation regex allows empty string

| | |
|---|---|
| **File** | `app/api/profile/update/route.ts` — line 22 |
| **Impact** | An empty phone number passes validation and gets saved to the database |

```ts
// ❌ Wrong — \d{0,11} allows 0 digits (empty string)
if (phone && !/^\d{0,11}$/.test(phone)) { ... }

// ✅ Fix — require at least 10 digits for Philippine numbers
if (phone && !/^\d{10,11}$/.test(phone)) { ... }
```

---

### 8. `change-password` endpoint has no session check

| | |
|---|---|
| **File** | `app/api/admin/change-password/route.ts` |
| **Impact** | Any caller who knows an employee's current password can change it without being authenticated |

No `getServerSession()` call exists. The endpoint accepts any `email` in the request body. Fix: validate that the session user's email matches the `email` in the request before allowing the change.

---

### 9. `DELETE /api/bookings/[id]` has no authentication check

| | |
|---|---|
| **File** | `app/api/bookings/[id]/route.ts` — line 156 |
| **Impact** | Any unauthenticated caller can delete any booking by ID |

The DELETE handler calls `deleteBooking(request)` directly with no session or role validation. A session check with an admin role requirement (`Owner` or `CSR`) must be added before deletion is allowed.

---

### 10. `getAllBookings` silently excludes bookings with no guest record

| | |
|---|---|
| **File** | `backend/controller/bookingController.ts` — lines 902–904 |
| **Impact** | Admin booking list misses any booking that has no corresponding `booking_guests` row |

The WHERE clause acts as an implicit INNER JOIN filter:

```sql
-- ❌ Wrong — excludes bookings with no guest row
WHERE bg.id = (SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1)

-- ✅ Fix — keep as LEFT JOIN and handle NULL in application
-- Remove that WHERE clause; the LEFT JOIN already handles it
```

---

### 11. `booking_guests` table has no `created_at` column but query orders by it

| | |
|---|---|
| **File** | `backend/controller/bookingController.ts` — lines 1028–1031 |
| **Impact** | Fetching individual booking details throws a SQL error every time |

```sql
-- ❌ Wrong — booking_guests has no created_at column
SELECT * FROM booking_guests WHERE booking_id = $1 ORDER BY created_at ASC

-- ✅ Fix — order by id instead
SELECT * FROM booking_guests WHERE booking_id = $1 ORDER BY id ASC
```

---

## Summary

| Severity | Count | Issues |
|---|---|---|
| **CRITICAL** | 3 | `roundedRect` crash, `getServerSession` missing `authOptions`, wrong table `staff_activity_logs` |
| **HIGH** | 3 | Profile fields not saved, 11× connection pool leaks, duplicate booking rows |
| **MEDIUM** | 4 | Phone regex, no auth on change-password, no auth on booking delete, guest filter excludes bookings, `created_at` on guests |

---

*Generated by Claude Code audit — Staycation Haven PH*

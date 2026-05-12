# Booking Calendar & Google Calendar — Implementation Guide

> Reference for replicating the CSR Booking Calendar and Google Calendar Sync in the **Admin (Owners)** role.

---

## 1. Overview

There are two separate calendar features:

| Feature | Purpose | Location (CSR) |
|---|---|---|
| **Booking Calendar** | Visual FullCalendar view of all bookings with room colors and status badges | `Components/admin/Csr/CalendarPage.tsx` |
| **Google Calendar Sync** | Syncs bookings without a `google_event_id` to Google Calendar via API | `Components/admin/Csr/GoogleCalendarPage.tsx` |

---

## 2. Data Source

### API Endpoint
Both features consume the same bookings data via RTK Query.

```ts
// redux/api/bookingsApi.ts
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";

const { data: bookings = [], isLoading, error } = useGetBookingsQuery({});
```

**Base URL:** `/api/bookings`  
**Response shape:** `{ success: boolean; data: Booking[] }`  
**RTK Query auto-transforms** the response to return `Booking[]` directly.

### Google Calendar Sync Mutation
```ts
const [syncCalendarBookings, { isLoading: isSyncing }] = useSyncCalendarBookingsMutation();
// POST /api/bookings/sync-calendar
// Finds bookings with no google_event_id and creates Google Calendar events for them
```

---

## 3. Booking Type

```ts
// types/booking.ts
export interface Booking extends BookingListItem {
  room_rate: number;
  security_deposit: number;
  add_ons_total: number;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  valid_id_url?: string | null;
  room_images?: string[];
  tower?: string | null;
  user_id?: string | null;
}

export interface BookingListItem {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email?: string;
  guest_phone?: string;
  room_name?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  adults?: number;
  children?: number;
  infants?: number;
  payment_method?: string | null;
  payment_proof_url?: string | null;
  payment_status?: string | null;
  down_payment?: number | null;
  total_amount?: number | null;
  remaining_balance?: number | null;
  status?: string | null;
  cleaning_status?: "pending" | "in-progress" | "cleaned" | "inspected" | null;
  rejection_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
```

---

## 4. Booking Calendar — Structure & Functions

### 4.1 CalendarEvent Interface
```ts
interface CalendarEvent {
  id: string;
  title: string;
  start: string;           // "YYYY-MM-DD" date-only string
  end: string;             // "YYYY-MM-DD" date-only string
  backgroundColor: string; // Room color (hex)
  borderColor: string;     // Room border color (hex)
  textColor: string;       // Always "#FFFFFF"
  extendedProps: {
    booking: Booking;
    duration: number;      // Calculated nights
    status: string;        // booking.status || ""
  };
}
```

### 4.2 Haven (Room) Color Map
Each room has a unique background color that does **not** conflict with status badge colors.

```ts
const HAVEN_COLORS: Record<string, { bg: string; border: string }> = {
  "Haven 1":  { bg: "#0EA5E9", border: "#0284C7" }, // Sky blue
  "Haven 2":  { bg: "#7C3AED", border: "#6D28D9" }, // Violet
  "Haven 3":  { bg: "#F43F5E", border: "#E11D48" }, // Rose
  "Haven 4":  { bg: "#0D9488", border: "#0F766E" }, // Teal
  "Haven 5":  { bg: "#D946EF", border: "#C026D3" }, // Fuchsia
  "Haven 7":  { bg: "#B45309", border: "#92400E" }, // Amber-brown
  "Haven 8":  { bg: "#64748B", border: "#475569" }, // Slate
  "Haven 10": { bg: "#65A30D", border: "#4D7C0F" }, // Lime green
};

const getRoomColor = (roomName: string) =>
  HAVEN_COLORS[roomName] ?? { bg: "#6B7280", border: "#4B5563" };
```

### 4.3 Status Badge Style
Renders a small pill badge on each event showing the booking status.
- Background and border use **rgba** with `0.75` opacity
- Text is white (`rgba(255,255,255,0.80)`)

```ts
const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase() || "") {
    case "pending":     return { color: "rgba(255,255,255,0.80)", bg: "rgba(202,138,4,0.75)",   border: "rgba(161,98,7,0.9)" };
    case "approved":
    case "confirmed":   return { color: "rgba(255,255,255,0.80)", bg: "rgba(22,163,74,0.75)",   border: "rgba(21,128,61,0.9)" };
    case "checked-in":  return { color: "rgba(255,255,255,0.80)", bg: "rgba(37,99,235,0.75)",   border: "rgba(29,78,216,0.9)" };
    case "checked-out": return { color: "rgba(255,255,255,0.80)", bg: "rgba(79,70,229,0.75)",   border: "rgba(67,56,202,0.9)" };
    case "completed":   return { color: "rgba(255,255,255,0.80)", bg: "rgba(5,150,105,0.75)",   border: "rgba(4,120,87,0.9)" };
    case "declined":
    case "rejected":    return { color: "rgba(255,255,255,0.80)", bg: "rgba(220,38,38,0.75)",   border: "rgba(185,28,28,0.9)" };
    case "cancelled":   return { color: "rgba(255,255,255,0.80)", bg: "rgba(234,88,12,0.75)",   border: "rgba(194,65,12,0.9)" };
    default:            return { color: "rgba(255,255,255,0.80)", bg: "rgba(107,114,128,0.75)", border: "rgba(75,85,99,0.9)" };
  }
};
```

### 4.4 Duration Calculation
```ts
const calculateDuration = (checkIn: string, checkOut: string): number => {
  const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
```

### 4.5 Date Normalization (Date-only, no time)
FullCalendar must receive `"YYYY-MM-DD"` strings for all-day events. This strips any time component:

```ts
const toDateOnly = (d: any): string => {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.split("T")[0];
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return s;
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
```

### 4.6 Building Calendar Events (useMemo)
```ts
const calendarEvents: CalendarEvent[] = useMemo(() => {
  let filteredBookings = bookings.filter(
    (b) => b.check_in_date && b.check_out_date
  );

  if (filterStatus !== "all") {
    filteredBookings = filteredBookings.filter(
      (b) => b.status?.toLowerCase() === filterStatus.toLowerCase()
    );
  }

  return filteredBookings.map((booking) => {
    const roomColors = getRoomColor(booking.room_name || "");
    const checkInDate  = toDateOnly(booking.check_in_date);
    const checkOutDate = toDateOnly(booking.check_out_date);

    return {
      id: booking.id,
      title: `${booking.guest_first_name} ${booking.guest_last_name} - ${booking.room_name || "Unknown Room"}`,
      start: checkInDate,
      end: checkOutDate,
      backgroundColor: roomColors.bg,
      borderColor: roomColors.border,
      textColor: "#FFFFFF",
      extendedProps: {
        booking,
        duration: calculateDuration(checkInDate, checkOutDate),
        status: booking.status || "",
      },
    };
  });
}, [bookings, filterStatus]);
```

### 4.7 Custom Event Renderer
Renders the event title + status badge in each calendar cell.

```tsx
const renderEventContent = (eventInfo: EventContentArg) => {
  const { duration, status } = eventInfo.event.extendedProps;
  const isMonthView = currentView === "dayGridMonth";
  const badge = getStatusBadgeStyle(status);

  return (
    <div className="px-1.5 py-0.5 overflow-hidden">
      {/* Title row with inline status badge */}
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        <div className="font-bold text-xs truncate min-w-0" style={{ color: "#FFFFFF" }}>
          {eventInfo.event.title}
        </div>
        {status && (
          <span
            style={{
              color: badge.color,
              backgroundColor: badge.bg,
              border: `1px solid ${badge.border}`,
              fontSize: "9px",
              padding: "1px 5px",
              borderRadius: "999px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {status}
          </span>
        )}
      </div>
      {/* Night count — month view only */}
      {isMonthView && (
        <div className="text-xs truncate" style={{ color: "#FFFFFF", opacity: 0.75 }}>
          {duration} {duration === 1 ? "night" : "nights"}
        </div>
      )}
    </div>
  );
};
```

### 4.8 FullCalendar Configuration
```tsx
<FullCalendar
  ref={calendarRef}
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  events={calendarEvents}
  eventClick={handleEventClick}
  eventContent={renderEventContent}
  datesSet={updateMonthYearDisplay}
  headerToolbar={false}          // Custom nav controls built separately
  height="100%"
  dayMaxEvents={3}               // "+N more" popover after 3
  moreLinkClick="popover"
  eventDisplay="block"           // Full block, not dot
  displayEventTime={false}
  firstDay={0}                   // Sunday start
  fixedWeekCount={false}
  showNonCurrentDates={true}
  nextDayThreshold="00:00:00"    // Show event on check-out day
/>
```

### 4.9 Event Detail Modal
Triggered on `eventClick`. Opens a portal (`createPortal`) over the page. Displays:
- Booking status badge
- Guest name, email, phone
- Room name
- Check-in / Check-out dates and times
- Duration in nights
- Guest counts (adults / children / infants)
- Payment summary (total, down payment, remaining)

---

## 5. Google Calendar Sync — Structure & Functions

### 5.1 How It Works
1. User clicks **"Sync Old Bookings to Calendar"**
2. Calls `POST /api/bookings/sync-calendar`
3. Backend finds all bookings where `google_event_id IS NULL`
4. Creates Google Calendar events for each and saves the returned `google_event_id`
5. Returns `{ synced, failed, total, results[], errors[] }`

### 5.2 Sync Result State
```ts
const [syncResult, setSyncResult] = useState<{
  message: string;
  synced: number;
  failed: number;
  total: number;
  errors?: string[];
  sampleLink?: string;    // html_link from first synced event
  calendarId?: string;    // which Google Calendar received the events
} | null>(null);
```

### 5.3 Google Calendar Embed
The page embeds the Google Calendar as an iframe:
```tsx
<iframe
  src="https://calendar.google.com/calendar/embed?src=staycationhaven9%40gmail.com&ctz=Asia%2FManila"
  style={{ border: 0, width: "100%", minHeight: "700px" }}
  frameBorder="0"
  scrolling="no"
/>
```
> **Account:** `staycationhaven9@gmail.com` | **Timezone:** `Asia/Manila`

---

## 6. Legend Structure

Two rows are shown below the filter controls:

```tsx
// Row 1 — Room colors
{Object.entries(HAVEN_COLORS).map(([name, colors]) => (
  <div key={name} className="flex items-center gap-1">
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bg }} />
    <span className="text-xs">{name}</span>
  </div>
))}

// Row 2 — Status colors (solid badge colors)
{[
  { label: "Pending",     color: "#EAB308" },
  { label: "Approved",    color: "#22C55E" },
  { label: "Checked-in",  color: "#3B82F6" },
  { label: "Checked-out", color: "#6366F1" },
  { label: "Completed",   color: "#10B981" },
  { label: "Declined",    color: "#EF4444" },
  { label: "Cancelled",   color: "#F97316" },
].map(({ label, color }) => (
  <div key={label} className="flex items-center gap-1">
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-xs">{label}</span>
  </div>
))}
```

---

## 7. Implementing in Admin (Owners) Role

### What Already Exists
- `Components/admin/Owners/CalendarPage.tsx` — exists but uses an older structure (no haven colors, no status badges, no legend)

### Steps to Align with CSR Version

1. **Copy `HAVEN_COLORS`, `getRoomColor`, `getStatusBadgeStyle`** into the Owners `CalendarPage.tsx`
2. **Update `CalendarEvent` interface** — add `status: string` to `extendedProps`
3. **Update the `calendarEvents` useMemo** — add `textColor: "#FFFFFF"` and `status: booking.status || ""` to each event
4. **Replace `renderEventContent`** with the version from Section 4.7
5. **Add the Legend** (Section 6) below the filter controls
6. **For Google Calendar Sync**, copy `GoogleCalendarPage.tsx` to `Components/admin/Owners/GoogleCalendarPage.tsx` — no backend changes needed, it uses the same `/api/bookings/sync-calendar` endpoint

### Shared API — No Changes Needed
Both roles use identical hooks:
```ts
useGetBookingsQuery({})          // fetch all bookings
useSyncCalendarBookingsMutation  // sync to Google Calendar
```

---

## 8. Required Packages

```json
"@fullcalendar/react": "^6.x",
"@fullcalendar/daygrid": "^6.x",
"@fullcalendar/timegrid": "^6.x",
"@fullcalendar/interaction": "^6.x",
"@fullcalendar/core": "^6.x"
```

---

## 9. Complete File Reference

All files involved in guest bookings and Google Calendar, grouped by layer.

### Backend — Controllers
| File | Responsibility |
|---|---|
| `backend/controller/bookingController.ts` | CRUD operations, status updates, calendar sync logic |
| `backend/controller/bookingPaymentsController.ts` | Payment records linked to bookings |
| `backend/utils/googleCalendar.ts` | Google Calendar API client — creates/updates events |

### Backend — Database
| File | Responsibility |
|---|---|
| `backend/models/bookings.sql` | Booking table schema |
| `backend/migrations/2026-01-30-fix-booking-payments.sql` | Payment table fix migration |
| `backend/migrations/2026-02-11-add-source-to-booking.sql` | Added `source` column to booking |

### API Routes (Next.js `app/api`)
| File | Method | Responsibility |
|---|---|---|
| `app/api/bookings/route.ts` | GET, POST, PUT, DELETE | List / create / update / delete bookings |
| `app/api/bookings/[id]/route.ts` | GET | Single booking detail |
| `app/api/bookings/user/[userId]/route.ts` | GET | Bookings by user |
| `app/api/bookings/room/[havenId]/route.ts` | GET | Bookings by room |
| `app/api/bookings/search/route.ts` | GET | Search bookings |
| `app/api/bookings/[id]/cleaning/route.ts` | PUT | Update cleaning status on a booking |
| `app/api/bookings/sync-calendar/route.ts` | POST | Sync bookings to Google Calendar |
| `app/api/booking-payments/route.ts` | GET, POST | List / create payment records |
| `app/api/booking-payments/[id]/route.ts` | GET, PUT | Single payment record |
| `app/api/send-booking-email/route.ts` | POST | Email on new booking |
| `app/api/send-checkin-email/route.ts` | POST | Email on check-in |
| `app/api/send-checkout-email/route.ts` | POST | Email on check-out |
| `app/api/send-down-payment-approval-email/route.ts` | POST | Email when down payment approved |
| `app/api/send-pending-email/route.ts` | POST | Email when booking set to pending |
| `app/api/send-rejection-email/route.ts` | POST | Email on booking rejection |

### Redux — State Management
| File | Responsibility |
|---|---|
| `redux/api/bookingsApi.ts` | RTK Query endpoints: `getBookings`, `getBookingById`, `createBooking`, `updateBookingStatus`, `deleteBooking`, `getUserBookings`, `getRoomBookings`, `updateCleaningStatus`, `syncCalendarBookings` |
| `redux/api/bookingPaymentsApi.ts` | RTK Query endpoints for payment records |
| `redux/slices/bookingSlice.ts` | Local booking state / selected booking slice |

### TypeScript Types
| File | Exports |
|---|---|
| `types/booking.ts` | `Booking`, `BookingListItem`, `AdditionalGuest` |
| `types/bookingPayment.ts` | Payment record types |

### Admin — CSR Role
| File | Responsibility |
|---|---|
| `Components/admin/Csr/BookingPage.tsx` | Main bookings table with filters, approve/reject actions |
| `Components/admin/Csr/CalendarPage.tsx` | FullCalendar view — room colors, status badges, event modal |
| `Components/admin/Csr/GoogleCalendarPage.tsx` | Google Calendar iframe + sync button |
| `Components/admin/Csr/Column/BookingIdWithProof.tsx` | Table column: booking ID + payment proof |
| `Components/admin/Csr/Modals/ApproveBookingModal.tsx` | Approve booking confirmation modal |
| `Components/admin/Csr/Modals/RejectBookingModal.tsx` | Reject booking with reason modal |
| `Components/admin/Csr/Modals/ViewBookingDetails.tsx` | Full booking detail modal |
| `Components/admin/Csr/Modals/ViewBookings.tsx` | Booking list modal (quick view) |
| `Components/admin/Csr/Modals/NewBookings.tsx` | New booking notification modal |
| `Components/admin/Csr/Modals/ExportBookingsModal.tsx` | Export bookings to file modal |
| `app/admin/csr/actions.ts` | Server actions for CSR booking operations |

### Admin — Owners Role
| File | Responsibility |
|---|---|
| `Components/admin/Owners/CalendarPage.tsx` | Owners calendar view (to be updated — see Section 7) |
| `Components/admin/Owners/Modals/BookingDateModal.tsx` | Date picker modal for owner booking management |
| `Components/admin/Owners/Modals/BookingModalSetting.tsx` | Booking settings modal |

### Public Guest Pages
| File | Responsibility |
|---|---|
| `app/booking-policy/page.tsx` | Guest-facing booking policy page |
| `app/bookings/[id]/page.tsx` | Guest booking detail page |
| `app/my-bookings/page.tsx` | Guest's booking history page |
| `components/BookingDetailsClient.tsx` | Client component for booking detail |
| `components/BookingPolicy.tsx` | Booking policy content component |
| `components/MyBookings.tsx` | Booking history list component |
| `components/SkeletonLoading/BookingDetailsSkeleton.tsx` | Loading skeleton for booking detail |
| `components/SkeletonLoading/BookingPageSkeleton.tsx` | Loading skeleton for booking page |
| `components/SkeletonLoading/MyBookingsSkeleton.tsx` | Loading skeleton for my bookings |

### Documentation Components
| File | Responsibility |
|---|---|
| `components/Documentation/GoogleCalendarContent.tsx` | Google Calendar usage docs |
| `components/Documentation/GoogleCalendarIntegrateContent.tsx` | Google Calendar integration setup docs |
| `components/Documentation/APIBookingContent.tsx` | Booking API docs |
| `app/documentation/api/booking/page.tsx` | API docs page for bookings |

# Booking System Implementation Guide

## Overview
Yung booking system ngayon ay nag-support na ng both **Guest Users** at **Logged-in Users**.

## Key Difference: Guest vs Logged-in User

### Guest User (Continue as Guest)
- `user_id` = `NULL` sa database
- **Walang transaction history** - di nila makikita yung past bookings
- Need nila i-save manually yung **Booking ID**
- One-time booking lang, walang account tracking

### Logged-in User (Google Sign-in)
- `user_id` = **UUID ng user** sa database
- **May transaction history** - makikita lahat ng bookings nila
- Automatic naka-link sa account
- Pwede i-track lahat ng reservations
- Future: Pwede gumawa ng "My Bookings" page

## Database Schema

### Bookings Table
```sql
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID, -- NULL for guest, UUID for logged-in users
  guest_first_name VARCHAR(100) NOT NULL,
  guest_last_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20) NOT NULL,
  room_name VARCHAR(255),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  check_out_time TIME NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  facebook_link TEXT,
  payment_method VARCHAR(50) NOT NULL,
  payment_proof_url TEXT,
  room_rate DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2) DEFAULT 0,
  add_ons_total DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  down_payment DECIMAL(10, 2) NOT NULL,
  remaining_balance DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  rejection_reason TEXT,
  add_ons JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
-- For faster status filtering
CREATE INDEX idx_bookings_status ON bookings(status);

-- For email lookups
CREATE INDEX idx_bookings_guest_email ON bookings(guest_email);

-- For transaction history (logged-in users)
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

-- For sorting by date
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
```

## Booking Flow

### 1. User Submits Checkout
- Guest user: `user_id = null`
- Logged-in user: `user_id = session.user.id`
- Payment proof uploaded to Cloudinary
- Booking saved with status = **'pending'**

### 2. Admin Sees in Reservations Page
- Filter by "Pending" to see all new bookings
- Shows complete guest information
- Can see payment proof

### 3. Admin Approves/Rejects
**Approve:**
- Click "Approve" button
- Status changes to **'approved'**
- Alert: "Booking approved! Confirmation email will be sent"
- TODO: Implement email sending

**Reject:**
- Click "Reject" button
- Prompt for rejection reason
- Status changes to **'rejected'**
- Rejection reason saved and displayed

### 4. Additional Status Flow
- **approved** → Can be checked in
- **checked-in** → Guest is currently staying
- **completed** → Guest checked out successfully
- **cancelled** → Booking was cancelled

## Files Modified

### 1. Database Schema
**File:** `backend/models/bookings.sql`
- Added `user_id UUID` field
- Added index on `user_id` for transaction history

### 2. Booking Controller
**File:** `backend/controller/bookingController.ts`
- Updated `Booking` interface to include `user_id`
- Modified `createBooking` to accept and store `user_id`
- `user_id` can be null for guest bookings

### 3. Checkout Component
**File:** `Components/Checkout.tsx`
- Added `useSession()` hook
- Sends `user_id` from session if logged in
- Sends `null` if guest user

### 4. Redux Store
**File:** `redux/store.ts`
- Added `bookingsApi` to reducer and middleware

### 5. Reservations Page
**File:** `Components/admin/Owners/ReservationsPage.tsx`
- Fetches real data from database using `useGetBookingsQuery()`
- Implemented approve/reject functionality
- Shows loading states and empty states
- Displays rejection reason for rejected bookings

## Next Steps

### 1. Run SQL in Neon.tech
```sql
-- Run this SQL in your Neon.tech database
-- File: backend/models/bookings.sql
```

### 2. Future: Transaction History Page
Create a "My Bookings" page for logged-in users:

```typescript
// Example query to get user's bookings
const { data } = useGetBookingsQuery({ user_id: session.user.id });
```

### 3. Email Notifications
Implement email sending when admin approves:
- Send confirmation email to `guest_email`
- Include booking details, booking ID, check-in info
- Can use SendGrid, Resend, or Nodemailer

### 4. Booking Details Modal
Add "View Details" functionality:
- Show full booking information
- Display add-ons purchased
- Show payment proof image
- Print booking confirmation

## Status Flow Chart

```
User Submits Checkout
         ↓
    [PENDING] ← Admin sees in Reservations
         ↓
    Admin Reviews
         ↓
    ┌────────┴────────┐
    ↓                 ↓
[APPROVED]      [REJECTED]
    ↓                 ↓
Check In         End (with reason)
    ↓
[CHECKED-IN]
    ↓
Check Out
    ↓
[COMPLETED]
```

## API Endpoints

### GET /api/bookings
Get all bookings (for admin)
```typescript
const { data } = useGetBookingsQuery({});
```

### POST /api/bookings
Create new booking
```typescript
await axios.post('/api/bookings', bookingData);
```

### PUT /api/bookings/[id]
Update booking status
```typescript
const [updateStatus] = useUpdateBookingStatusMutation();
await updateStatus({ id, status: 'approved' });
```

## Important Notes

1. **Guest bookings are stored permanently** - kahit walang account, naka-save sa database
2. **Booking ID is unique** - Generated using timestamp: `BK${Date.now()}`
3. **Payment proof auto-uploaded** - Cloudinary handles image storage
4. **Admin approval required** - Walang auto-confirmation
5. **Transaction history** - Available for logged-in users via `user_id` filter

## Summary

Ngayon, yung system mo ay:
- ✅ Supports both guest and logged-in users
- ✅ Saves all bookings to database
- ✅ Shows bookings in admin Reservations page
- ✅ Has approve/reject functionality
- ✅ Tracks booking status throughout lifecycle
- ✅ Ready for transaction history feature
- ⏳ Pending: Email sending on approval
- ⏳ Pending: Run SQL to create tables

# Booking System Implementation Guide

## Overview
Yung booking system ngayon ay nag-support na ng both **Guest Users** at **Logged-in Users**.

---

## Project File Structure

Para sa mga future developers, ito yung complete file organization ng Staycation project:

```
STAYCATION/
├── .claude/                                # Claude AI context files
├── .git/                                   # Git repository
├── .next/                                  # Next.js build output
├── .env                                    # Environment variables
├── .gitignore
├── .gitattributes

# ROOT CONFIGURATION FILES
├── package.json                            # Node dependencies and scripts
├── package-lock.json
├── tsconfig.json                           # TypeScript configuration
├── next.config.ts                          # Next.js configuration
├── middleware.ts                           # NextAuth & role-based routing middleware
├── tailwind.config.js                      # Tailwind CSS configuration
├── postcss.config.js                       # PostCSS configuration
├── eslint.config.mjs                       # ESLint configuration
├── docker-compose.yml                      # Docker services (PostgreSQL)
├── Dockerfile                              # Docker image configuration
├── rename-routes.bat                       # Windows batch script
├── next-env.d.ts                           # TypeScript definitions for Next.js

# DOCUMENTATION
├── BOOKING_SYSTEM_GUIDE.md                 # Booking system documentation
├── EMAIL_INTEGRATION_GUIDE.md              # Email integration documentation
├── README.md                               # Project README

# PUBLIC ASSETS
├── public/
│   ├── favicon.ico
│   ├── haven_logo.png
│   ├── shlogo.png
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   └── Images/                             # Room images (Cloudinary managed)
│       ├── bg.jpg
│       └── haven_9_*.jpg / haven9_*.jpg    # Room photos

# FRONTEND PAGES (Next.js App Router)
├── app/
│   ├── layout.tsx                          # Root layout with providers
│   ├── page.tsx                            # Home page
│   ├── loading.tsx                         # Loading skeleton
│   ├── globals.css                         # Global styles
│
│   # PUBLIC PAGES
│   ├── about/page.tsx                      # About page
│   ├── contacts/page.tsx                   # Contact us page
│   ├── location/page.tsx                   # Location/map page
│   ├── login/page.tsx                      # User login page
│   ├── unauthorized/page.tsx               # Unauthorized access page
│
│   # USER AUTHENTICATED PAGES
│   ├── profile/page.tsx                    # User profile page
│   ├── my-bookings/page.tsx                # Booking history page
│   ├── my-wishlist/page.tsx                # Wishlist page
│   ├── checkout/page.tsx                   # Booking checkout page
│   ├── bookings/[id]/page.tsx              # Booking details page
│
│   # ROOMS/LISTINGS
│   ├── rooms/
│   │   ├── page.tsx                        # Rooms listing page
│   │   └── [id]/
│   │       ├── page.tsx                    # Room detail server component
│   │       └── RoomDetailsClient.tsx       # Room detail client component
│
│   # ADMIN PAGES
│   ├── admin/
│   │   ├── login/page.tsx                  # Admin login page
│   │   ├── owners/                         # Property owners dashboard
│   │   │   ├── page.tsx
│   │   │   └── analytics/page.tsx          # Analytics page
│   │   ├── csr/                            # Customer service rep dashboard
│   │   │   ├── page.tsx
│   │   │   └── inventory/page.tsx
│   │   ├── cleaners/page.tsx               # Cleaners management
│   │   └── partners/page.tsx               # Partners management
│
│   # API ROUTES
│   └── api/
│       ├── auth/[...nextauth]/route.ts     # NextAuth authentication handler
│       │
│       ├── admin/
│       │   ├── login/route.ts              # Admin login API
│       │   ├── haven/route.ts              # Haven management (GET, POST, DELETE)
│       │   ├── haven/[id]/route.ts         # Individual haven CRUD
│       │   ├── employees/route.ts          # Employee management
│       │   ├── employees/[id]/route.ts
│       │   ├── analytics/
│       │   │   ├── summary/route.ts        # Analytics summary
│       │   │   ├── monthly-revenue/route.ts
│       │   │   └── revenue-by-room/route.ts
│       │   ├── activity-logs/route.ts
│       │   └── activity-stats/route.ts
│       │
│       ├── bookings/
│       │   ├── route.ts                    # Create/list bookings
│       │   ├── [id]/route.ts               # Get/update/delete booking
│       │   ├── user/[userId]/route.ts      # Get user's bookings
│       │   └── room/[havenId]/route.ts     # Get room bookings/availability
│       │
│       ├── haven/
│       │   ├── route.ts                    # Get all havens
│       │   ├── [id]/route.ts               # Get haven by ID
│       │   └── addHavenRoom/route.ts       # Add new haven room
│       │
│       ├── wishlist/
│       │   ├── route.ts                    # Create wishlist
│       │   ├── [userId]/route.ts           # Get user's wishlist
│       │   ├── check/[userId]/[havenId]/route.ts
│       │   └── delete/[id]/route.ts
│       │
│       ├── messages/
│       │   ├── send/route.ts
│       │   ├── conversations/route.ts
│       │   ├── mark-read/route.ts
│       │   └── [conversationId]/route.ts
│       │
│       ├── users/route.ts
│       ├── google-login/route.ts
│       ├── inventory/route.ts
│       │
│       # EMAIL ROUTES
│       ├── send-booking-email/route.ts     # Send booking confirmation
│       ├── send-checkin-email/route.ts     # Send check-in reminder
│       ├── send-checkout-email/route.ts    # Send check-out reminder
│       └── send-pending-email/route.ts     # Send pending payment reminder

# REACT COMPONENTS
├── Components/
│   # CORE UI COMPONENTS
│   ├── Navbar.tsx                          # Navigation bar
│   ├── Footer.tsx                          # Footer component
│   ├── Modal.tsx                           # Reusable modal
│   ├── Spinner.tsx                         # Loading spinner
│   ├── Loading.tsx                         # Loading page
│   ├── Providers.tsx                       # Redux provider
│   ├── UIProviders.tsx                     # NextUI provider
│   ├── Login.tsx                           # Login component
│   ├── Contacts.tsx                        # Contact form
│   ├── Location.tsx                        # Location map
│   ├── MyBookings.tsx                      # Bookings list
│   ├── MyWishlist.tsx                      # Wishlist display
│   ├── Checkout.tsx                        # Checkout form
│   ├── BookingDetailsClient.tsx            # Booking details
│   ├── StayTypeCard.tsx                    # Stay type card
│   ├── SocialIcon.tsx                      # Social icon
│   ├── SoclalLoginButton.tsx               # Social login button
│
│   # HERO SECTION COMPONENTS
│   ├── HeroSection/
│   │   ├── HeroSectionMain.tsx             # Hero section container
│   │   ├── SearchBarSticky.tsx             # Sticky search bar
│   │   ├── SearchButton.tsx                # Search button
│   │   ├── DatePicker.tsx                  # Date range picker
│   │   ├── GuestCounter.tsx                # Guest counter
│   │   ├── GuestSelectionModal.tsx         # Guest selection modal
│   │   ├── LocationSelector.tsx            # Location dropdown
│   │   ├── StayTypeSelectorModal.tsx       # Stay type modal
│   │   └── ValidationModal.tsx             # Validation error modal
│
│   # ROOM LISTING COMPONENTS
│   ├── Rooms/
│   │   ├── HotelRoomListings.tsx           # Room listings container
│   │   ├── RoomCard.tsx                    # Individual room card
│   │   ├── RoomImageGallery.tsx            # Image carousel
│   │   ├── RoomsDetailsPage.tsx            # Room details layout
│   │   ├── RoomMap.tsx                     # Map component
│   │   └── AmenityBadge.tsx                # Amenity badge
│
│   # FEATURES SECTION
│   ├── Features/
│   │   ├── FeatureSectionMain.tsx          # Features container
│   │   └── FeatureCard.tsx                 # Feature card
│
│   # ADMIN COMPONENTS
│   └── admin/
│       # CUSTOMER SERVICE REP DASHBOARD
│       ├── Csr/
│       │   ├── CsrDashboardPage.tsx        # CSR main dashboard
│       │   ├── BookingPage.tsx             # Bookings management
│       │   ├── CleanersPage.tsx            # Cleaners management
│       │   ├── InventoryPage.tsx           # Inventory management
│       │   ├── MessagePage.tsx             # Messages
│       │   ├── NotificationPage.tsx        # Notifications
│       │   ├── PaymentPage.tsx             # Payment tracking
│       │   ├── ProfilePage.tsx             # CSR profile
│       │   ├── SettingsPage.tsx            # Settings
│       │   │
│       │   ├── Auth/
│       │   │   ├── CsrLogout.tsx           # Logout logic
│       │   │   └── ProtectedCsrRoute.tsx   # Route protection
│       │   │
│       │   └── Modals/
│       │       ├── AddItem.tsx             # Add inventory item
│       │       ├── EditItem.tsx            # Edit inventory item
│       │       ├── ViewItem.tsx            # View item details
│       │       ├── DeleteConfirmation.tsx
│       │       ├── NewBookings.tsx         # Create booking
│       │       ├── ViewBookings.tsx        # View booking details
│       │       ├── Message.tsx
│       │       └── Notification.tsx
│       │
│       # PROPERTY OWNERS DASHBOARD
│       ├── Owners/
│       │   ├── OwnerDashboardPage.tsx      # Main dashboard
│       │   ├── HavenMagementPage.tsx       # Haven/room management
│       │   ├── ViewAllUnits.tsx            # View all units
│       │   ├── ReservationsPage.tsx        # Reservations list
│       │   ├── AnalyticsPage.tsx           # Analytics dashboard
│       │   ├── AnalyticsClient.tsx         # Analytics client component
│       │   ├── RevenueManagementPage.tsx   # Revenue tracking
│       │   ├── ReviewsPage.tsx             # Guest reviews
│       │   ├── AuditLogsPage.tsx           # Audit logs
│       │   ├── StaffActivityPage.tsx       # Staff activity tracking
│       │   ├── MessagesPage.tsx            # Messages
│       │   ├── GuestAssistancePage.tsx     # Guest support
│       │   ├── MaintenancePage.tsx         # Maintenance tracking
│       │   ├── ProfilePage.tsx             # Owner profile
│       │   ├── SettingsPage.tsx            # Settings
│       │   │
│       │   └── Modals/
│       │       ├── AddNewHavenModal.tsx    # Add new property
│       │       ├── AddUnitModal.tsx        # Add unit to property
│       │       ├── EditHavenModal.tsx      # Edit property details
│       │       ├── DeleteHavenModal.tsx    # Delete property
│       │       ├── AdminLogin.tsx          # Admin login modal
│       │       ├── CreateEmployeeModal.tsx # Create staff member
│       │       ├── EditEmployeeModal.tsx   # Edit staff member
│       │       ├── BookingModalSetting.tsx
│       │       ├── BookingDateModal.tsx
│       │       ├── PaymentSettingsModal.tsx
│       │       ├── PoliciesModal.tsx
│       │       └── NewMessageModal.tsx
│       │
│       └── Partners/
│           └── PartnersDashboard.tsx       # Partners dashboard

# BACKEND LOGIC
├── backend/
│   ├── config/
│   │   └── db.ts                           # PostgreSQL (Neon) connection pool
│   │
│   ├── models/                             # SQL schema definitions
│   │   ├── room.sql                        # havens, haven_images, photo_tour_images, blocked_dates
│   │   ├── bookings.sql                    # bookings table schema
│   │   ├── employee.sql                    # employees table schema
│   │   ├── wishlist.sql                    # wishlist table schema
│   │   ├── messages.sql                    # messages table schema
│   │   └── add_guest_details.sql           # guest details table schema
│   │
│   ├── controller/                         # Business logic handlers
│   │   ├── roomController.ts               # Haven/room operations
│   │   ├── bookingController.ts            # Booking management
│   │   ├── userController.ts               # User management
│   │   ├── employeeController.ts           # Employee operations
│   │   ├── wishlistController.ts           # Wishlist operations
│   │   ├── messageController.ts            # Messaging logic
│   │   ├── inventoryController.ts          # Inventory management
│   │   ├── activityLogController.ts        # Activity logging
│   │   └── analyticsController.ts          # Analytics calculations
│   │
│   ├── middlewares/
│   │   └── auth.ts                         # Authentication middleware
│   │
│   └── utils/
│       └── cloudinary.ts                   # Cloudinary image upload config

# STATE MANAGEMENT (Redux Toolkit)
├── redux/
│   ├── store.ts                            # Redux store configuration
│   ├── hooks.ts                            # Custom Redux hooks
│   │
│   ├── slices/
│   │   └── bookingSlice.ts                 # Booking state slice
│   │
│   └── api/                                # RTK Query APIs
│       ├── roomApi.ts                      # Room queries
│       ├── bookingsApi.ts                  # Booking queries
│       ├── employeeApi.ts                  # Employee queries
│       ├── wishlistApi.ts                  # Wishlist queries
│       ├── messagesApi.ts                  # Message queries
│       ├── activityLogApi.ts               # Activity log queries
│       └── analyticsApi.ts                 # Analytics queries

# TYPE DEFINITIONS
├── types/
│   ├── Haven.ts                            # Haven/Room interface
│   └── next-auth.d.ts                      # NextAuth type extensions

# UTILITIES
├── lib/
│   └── auth.ts                             # Authentication utilities
```

### Architecture Summary

**Frontend:**
- Next.js 15 with App Router
- Feature-based component organization
- Admin dashboards for different roles (Owners, CSR, Partners, Cleaners)

**Backend:**
- Next.js API routes (serverless)
- PostgreSQL database (Neon)
- Controller pattern for business logic

**State Management:**
- Redux Toolkit with RTK Query
- 7 API endpoints for data synchronization
- Booking state slice

**Authentication:**
- NextAuth with Google OAuth
- Role-based middleware routing
- Protected admin routes

**Database Tables:**
1. havens - Room/property info
2. haven_images - Display images
3. photo_tour_images - Category photos
4. blocked_dates - Availability
5. bookings - Reservations
6. employees - Staff management
7. wishlist - User favorites
8. messages - Conversations
9. guest_details - Additional info

---

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

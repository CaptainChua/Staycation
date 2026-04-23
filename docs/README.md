# Staycation Documentation

Welcome to the Staycation project documentation. This directory contains comprehensive guides and references for the platform.

## 🚀 Quick Start

### 📱 Interactive API Documentation (Recommended)
**[Open Interactive API Docs](./index.html)** - Modern, searchable API reference with React Native examples
- Fully interactive endpoint explorer
- React Native TypeScript code examples
- cURL examples for testing
- Live response formats
- Category-based navigation

## 📚 Main Documentation

1. **[Detailed API Documentation](./API_DOCUMENTATION.md)** - Complete markdown reference for all 91 API endpoints
   - Organized by category
   - Full endpoint specifications
   - Authentication details
   - Parameter descriptions

2. **[Booking System Guide](../BOOKING_SYSTEM_GUIDE.md)** - Complete guide to the booking system
   - Booking workflow
   - Payment structures
   - Status transitions
   - Integration details

3. **[Email Integration Guide](../EMAIL_INTEGRATION_GUIDE.md)** - Email template and integration guide
   - Email templates
   - Integration setup
   - Template variables

### 🏗️ Git Workflow

- **[Git Workflow](./git-workflow/)** - Git branching and workflow guidelines

---

## Quick Navigation

### By Feature Area

#### 👥 Admin & Staff
- Admin login: `/api/admin/login`
- Employee management: `/api/admin/employees`
- Activity logging: `/api/admin/activity-logs`
- Staff task assignment: `/api/admin/cleaners/tasks/[id]/assign`

#### 🏠 Properties
- List all properties: `/api/haven`
- Property details: `/api/haven/[id]`
- Add new property: `/api/haven/addHavenRoom`
- Blocked dates: `/api/admin/blocked-dates`

#### 📅 Bookings
- Create booking: `POST /api/bookings`
- Get user bookings: `/api/bookings/user/[userId]`
- Search bookings: `/api/bookings/search`
- Update status: `PUT /api/bookings/[id]`

#### 💳 Payments
- Manage payments: `/api/booking-payments`
- Payment methods: `/api/payment-methods`
- Down payment approval: `/api/send-down-payment-approval-email`

#### 🧹 Cleaning
- Assign tasks: `/api/admin/cleaners/tasks/[id]/assign`
- Start task: `/api/admin/cleaners/tasks/[id]/start`
- Complete task: `/api/admin/cleaners/tasks/[id]/complete`
- View checklist: `/api/admin/cleaners`

#### 📊 Analytics
- Monthly revenue: `/api/admin/analytics/monthly-revenue`
- Revenue by room: `/api/admin/analytics/revenue-by-room`
- Summary stats: `/api/admin/analytics/summary`
- Employee performance: `/api/admin/cleaners/[employeeId]/performance`

#### 💬 Communication
- Send message: `/api/messages/send`
- Conversations: `/api/messages/conversations`
- Notifications: `/api/notifications`

#### 📧 Email Services
- Booking confirmation: `/api/send-booking-email`
- Check-in: `/api/send-checkin-email`
- Check-out: `/api/send-checkout-email`

#### ⭐ User Features
- Wishlist: `/api/wishlist`
- Reviews: `/api/reviews`
- Profile update: `/api/profile/update`

---

## API Statistics

- **Total Endpoints:** 91
- **Categories:** 17
- **Required Authentication Endpoints:** 60+
- **Public Endpoints:** ~15

---

## Getting Started

1. **Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for complete endpoint reference
2. **Check [BOOKING_SYSTEM_GUIDE.md](../BOOKING_SYSTEM_GUIDE.md)** for booking workflow
3. **Refer to [EMAIL_INTEGRATION_GUIDE.md](../EMAIL_INTEGRATION_GUIDE.md)** for email setup

---

## Common Use Cases

### Scenario: User Makes a Booking
1. User views property: `GET /api/haven/[id]`
2. User checks discounts: `GET /api/discounts/room-discounts`
3. User creates booking: `POST /api/bookings`
4. System creates cleaning task: `GET /api/admin/cleaners/tasks/by-booking/[id]`
5. Send confirmation email: `POST /api/send-booking-email`

### Scenario: Admin Assigns Cleaning Task
1. View unassigned tasks: `GET /api/admin/cleaners/tasks`
2. Assign to cleaner: `PUT /api/admin/cleaners/tasks/[id]/assign`
3. Cleaner starts task: `PUT /api/admin/cleaners/tasks/[id]/start`
4. Cleaner completes task: `PUT /api/admin/cleaners/tasks/[id]/complete`
5. View performance: `GET /api/admin/cleaners/[employeeId]/performance`

### Scenario: Guest Communication
1. Create conversation: `POST /api/messages/conversations`
2. Send message: `POST /api/messages/send`
3. Mark as read: `POST /api/messages/mark-read`
4. Get history: `GET /api/messages/[conversationId]`

---

## Important Endpoints by Role

### Guest/User
- Profile: `/api/profile/update`, `/api/users`
- Bookings: `/api/bookings`, `/api/bookings/user/[userId]`
- Wishlist: `/api/wishlist`
- Reviews: `/api/reviews`
- Messages: `/api/messages/`
- Auth: `/api/auth/register`, `/api/auth/[...nextauth]`

### Admin/Employee
- Dashboard: `/api/admin/analytics/summary`
- Employees: `/api/admin/employees`
- Cleaning Tasks: `/api/admin/cleaners/tasks`
- Bookings: `/api/bookings`
- Reports: `/api/report`
- Settings: `/api/admin/settings/csr`

### Property Manager
- Properties: `/api/haven`
- Bookings by room: `/api/bookings/room/[havenId]`
- Blocked dates: `/api/admin/blocked-dates`
- Analytics: `/api/admin/analytics/`
- Reviews: `/api/reviews`

---

## For Developers

### Adding New Endpoints
1. Create new route file in `/app/api/[category]/route.ts`
2. Export handler functions (GET, POST, PUT, DELETE, PATCH)
3. Document the endpoint in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
4. Update this README if necessary

### Modifying Existing Endpoints
1. Update the route file
2. Update documentation to reflect changes
3. Check for dependent calls in Redux slices or components

### Testing
- Verify request/response formats match documentation
- Test with different user roles and permissions
- Check error handling

---

## Support & Questions

For questions about:
- **API Endpoints:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Booking System:** See [BOOKING_SYSTEM_GUIDE.md](../BOOKING_SYSTEM_GUIDE.md)
- **Emails:** See [EMAIL_INTEGRATION_GUIDE.md](../EMAIL_INTEGRATION_GUIDE.md)
- **Git Workflow:** See [git-workflow/](./git-workflow/)

---

**Last Updated:** March 2, 2026
**Documentation Version:** 1.0

# Staycation Haven — MVP Workflow Prompts (CSR & Admin/Owner)

---

## ADMIN (Owner) Dashboard

**Route:** `/admin/owners`

---

### Section: OVERVIEW

#### 1. Dashboard
> As an Admin, I see a high-level overview of the platform — revenue summaries, occupancy stats, recent booking activity, and staff performance indicators. This is my starting point every time I log in.

#### 2. Analytics & Reports
> As an Admin, I access a dedicated analytics dashboard showing revenue trends, booking statistics, occupancy rates, and room-level performance. I can filter data by date range and export reports to PDF or Excel.

---

### Section: BOOKINGS

#### 3. Booking Calendar
> As an Admin, I view a calendar showing all confirmed, pending, and cancelled reservations across the property. This gives me a visual overview of occupancy and helps me spot conflicts or gaps in scheduling.

#### 4. Reservations
> As an Admin, I have read access to all reservations and can oversee CSR actions. I can intervene on escalated cases or override booking decisions.

#### 5. Blocked Dates
> As an Admin, I set dates when specific rooms or the entire property is unavailable for booking — due to maintenance, private events, or holidays. Blocked dates are reflected in real time on the booking calendar and prevent guests from selecting those dates during checkout.

---

### Section: PROPERTY

#### 6. Haven Management
> As an Admin, I manage the property listings (Havens) on the platform. I can create new haven entries with details like name, description, photos, pricing, capacity, and amenities. I can edit existing haven information, toggle availability, and remove listings.

#### 7. Maintenance
> As an Admin, I log and track maintenance tasks for property rooms and facilities. I can create maintenance records, assign them to staff, set priority levels, and mark them as resolved. Active maintenance tasks can automatically block room availability.

#### 8. Cleaning Management
> As an Admin, I oversee all cleaning operations — view assigned cleaning tasks, monitor completion status, and review cleaning history per room and booking.

---

### Section: FINANCE

#### 9. Revenue Management
> As an Admin, I track income generated from bookings, view revenue breakdowns by room and date, and monitor financial performance over time.

#### 10. Payment Methods
> As an Admin, I configure the payment gateways accepted on the platform (e.g., GCash, bank transfer, credit card). I can activate or deactivate payment options and define payment instructions shown to guests during checkout.

---

### Section: COMMUNICATION

#### 11. Guest Assistance
> As an Admin, I view and manage guest support tickets and assistance requests. I can monitor escalated issues raised by CSR staff and provide resolutions.

#### 12. Messages
> As an Admin, I monitor message threads across all staff, send system-wide announcements, and communicate with CSR and cleaning staff.

#### 13. Reviews & Feedback
> As an Admin, I view all guest reviews submitted for rooms and haven experiences. I can monitor ratings, flag inappropriate content, and respond to feedback.

---

### Section: TEAM

#### 14. Staff Management
> As an Admin, I create and manage employee accounts for CSR and Cleaner roles. I assign their credentials, set their role, and deactivate accounts when staff leave.

#### 15. User Management
> As an Admin, I view and manage guest accounts registered on the platform. I can search users, view their booking history, suspend accounts for policy violations, and review profile information.

#### 16. Partner Management
> As an Admin, I manage external partner relationships linked to the platform. I can create and configure partner accounts, set access levels, and track partner-related activity. *(Currently in development — placeholder in MVP.)*

---

### Section: SYSTEM

#### 17. Settings
> As an Admin, I manage global system settings — platform configurations, email templates, notification rules, and account security policies.

#### 18. Audit Logs
> As an Admin, I access the full audit trail of system-wide actions — including all CSR actions, employee login events, configuration changes, and booking modifications.

---

---

## CSR (Customer Service Representative) Dashboard

**Route:** `/admin/csr`

---

### Section: OVERVIEW

#### 1. Dashboard
> As a CSR, I see a summary of today's bookings, pending tasks, unread messages, payment alerts, and active cleaning jobs. This is my daily operational starting point.

---

### Section: BOOKINGS

#### 2. Bookings Management
> As a CSR, I process incoming booking requests — approving, declining, or modifying reservations. I handle check-in confirmations, checkout processing, and booking-related guest concerns.

#### 3. Booking Calendar
> As a CSR, I use the calendar view to see all confirmed, pending, and cancelled bookings laid out by date. I can click on a booking entry directly from the calendar to view its details or take action.

---

### Section: FINANCE

#### 4. Payment Management
> As a CSR, I verify payment submissions from guests (manual bank transfers, GCash proofs), mark payments as confirmed, and generate payment receipts. I handle partial payments, balance dues, and refund requests.

#### 5. Security Deposit
> As a CSR, I track security deposits tied to each booking. I can record when a deposit has been received, mark it as forfeited in case of damage or policy breach, or flag it for refund after a guest checks out.

#### 6. Discount Management
> As a CSR, I apply existing discount codes or promotions to a booking when requested by a guest or authorized by the Admin.

---

### Section: OPERATIONS

#### 7. Deliverables Management
> As a CSR, I manage the list of items or services included in or added to a booking (e.g., welcome kits, extra linens, food packages). I can create deliverable records, mark them as fulfilled or pending, and track delivery status per booking.

#### 8. Cleaners Management
> As a CSR, I assign cleaning tasks to available cleaner staff after a booking checkout is confirmed. I can view each cleaner's current workload, assign or reassign tasks, and monitor the status of cleaning jobs (pending, in progress, completed).

#### 9. Inventory Management
> As a CSR, I track the physical inventory of the property — consumables, amenities, supplies, and equipment. I can add new inventory items, update stock quantities, flag items as low stock, and log replenishment.

---

### Section: COMMUNICATION

#### 10. Messages
> As a CSR, I handle guest inquiries and respond to support messages in real time. I can start conversations with guests, attach files, and escalate issues to the Admin.

---

### Section: SYSTEM

#### 11. Activity Logs
> As a CSR, I view a log of my own actions — bookings processed, payments recorded, discounts applied — for personal reference and accountability.

#### 12. Settings
> As a CSR, I manage my own account settings — update my profile, change my password, and configure personal notification preferences.

---

---

## Quick Reference — Sections & Modules by Role

### Admin (Owner)

| Section | Module |
|---|---|
| Overview | Dashboard |
| Overview | Analytics & Reports |
| Bookings | Booking Calendar |
| Bookings | Reservations |
| Bookings | Blocked Dates |
| Property | Haven Management |
| Property | Maintenance |
| Property | Cleaning Management |
| Finance | Revenue Management |
| Finance | Payment Methods |
| Communication | Guest Assistance |
| Communication | Messages |
| Communication | Reviews & Feedback |
| Team | Staff Management |
| Team | User Management |
| Team | Partner Management |
| System | Settings |
| System | Audit Logs |

### CSR

| Section | Module |
|---|---|
| Overview | Dashboard |
| Bookings | Bookings Management |
| Bookings | Booking Calendar |
| Finance | Payment Management |
| Finance | Security Deposit |
| Finance | Discount Management |
| Operations | Deliverables Management |
| Operations | Cleaners Management |
| Operations | Inventory Management |
| Communication | Messages |
| System | Activity Logs |
| System | Settings |

---

## Access Classification

| Module | CSR | Admin |
|---|---|---|
| Dashboard | Shared | Shared |
| Analytics & Reports | — | Admin Only |
| Booking Calendar | Shared | Shared |
| Bookings Management / Reservations | Shared | Shared |
| Blocked Dates | — | Admin Only |
| Haven Management | — | Admin Only |
| Maintenance | — | Admin Only |
| Cleaning Management | — | Admin Only |
| Revenue Management | — | Admin Only |
| Payment Methods | — | Admin Only |
| Payment Management | CSR Only | — |
| Security Deposit | CSR Only | — |
| Discount Management | CSR Only | — |
| Deliverables Management | CSR Only | — |
| Cleaners Management | CSR Only | — |
| Inventory Management | CSR Only | — |
| Guest Assistance | — | Admin Only |
| Messages | Shared | Shared |
| Reviews & Feedback | — | Admin Only |
| Staff Management | — | Admin Only |
| User Management | — | Admin Only |
| Partner Management | — | Admin Only |
| Activity Logs | Shared (own only) | Shared (all users) |
| Audit Logs | — | Admin Only |
| Settings | Shared (personal) | Shared (global) |

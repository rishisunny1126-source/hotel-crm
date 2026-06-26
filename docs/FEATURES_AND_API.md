# Hotel Enquiry & Follow-Up CRM — Features, Tech Stack & API Reference

_Company: SRI NIRVANA PLAZA · Reference implementation_

---

## 1. Features (by module)

### Authentication & Access
- JWT login/logout with short-lived access token + rotating refresh token (revocable, hashed in DB).
- Role-Based Access Control across 6 roles: admin, manager, front desk, housekeeping, accounts, corporate coordinator.
- Password hashing (bcrypt, 12 rounds), session validation, current-user lookup, admin-only user registration.

### Dashboard & Analytics
- 10 live KPI cards: total enquiries, new enquiries, pending follow-ups, confirmed bookings, lost leads, occupied rooms, available rooms, housekeeping pending, open complaints, corporate bookings.
- Charts: enquiries by source, booking conversion rate, revenue trend, room occupancy.
- Recent activity feed from the audit history.

### Guest Enquiry CRM
- Capture: guest name, mobile, email, city, source, room type, guest count, check-in/out dates, budget, special requirements, assigned staff.
- Status pipeline: New → Contacted → Interested → Follow-Up Pending → Confirmed → Cancelled / Lost.
- Create, edit, search (name/mobile/email), filter (status/source/staff), assign, and change status.

### Follow-Up Management
- Schedule follow-ups with date, time, notes, priority, and assigned staff.
- Overdue and due-today views, mark complete, priority levels (low/medium/high/urgent).

### Enquiry History Timeline
- Immutable audit trail: created, updated, status_changed (from→to), follow_up_added, assigned, booking_confirmed — with actor and timestamp.

### Room & Availability
- Room inventory: number, type, capacity, rate, floor, status (available/reserved/occupied/cleaning/maintenance) and housekeeping status.
- Conflict-free availability search by date range and room type.
- Double-booking prevented at the database level (GiST exclusion constraint).

### Booking Management
- Direct booking and one-click convert-from-enquiry (auto-creates/links guest, confirms enquiry, logs history).
- Check-in and check-out actions; check-out flags housekeeping and updates loyalty totals.
- Seasonal pricing applied automatically at booking time.

### Self Check-in
- Guest self check-in submissions (name, phone, ID proof, date, booking link) with manager review flag.

### Room Service
- Requests by type (food, laundry, extra towel, extra bed, cleaning, other) with status workflow (requested → assigned → in progress → completed).

### Housekeeping
- Room cleaning queue, staff assignment, readiness tracking (dirty → cleaning → ready → occupied).

### Feedback & Complaints
- Guest feedback (1–5 rating + comments) and feedback analytics.
- Complaints with title, description, priority, assignment, and status (open → in progress → resolved → closed).

### Corporate & Group Bookings
- Corporate accounts: company, contact, rooms required, dates, budget, coordinator, status.
- Group bookings: group name, guest/room counts, arrival/departure, contact.

### Loyalty Profiles
- Guest master with total stays, lifetime value, preferred room type, preferred services, loyalty tier.

### Shift Handover
- Cross-shift notes by shift (morning/evening/night), staff, priority, completion flag.

### Payments & GST
- Record payments with automatic GST computation (0/5/12/18% slabs) and method (cash/card/UPI/bank transfer/online).
- Daily revenue settlement: transactions, taxable value, GST collected, grand total, breakup by method and GST rate.
- GST tax-invoice PDF per payment.

### Seasonal Pricing
- Rate plans by room type and date range with priority resolution; effective nightly rate applied during booking.

### AI / Rule-Based Follow-Up
- Personalized follow-up message generation per enquiry status (rule-based, AI-prompt ready).
- Reminder job/endpoint that dispatches messages for due/overdue follow-ups via a pluggable email/WhatsApp transport.

### Reporting
- Reports: enquiry, booking, occupancy, revenue, follow-up, complaint.
- Export to CSV and PDF; admin/manager/accounts access.

### Cross-cutting
- Consistent JSON response envelope, centralized error handling, pagination, search and filtering on list endpoints.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Router, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon serverless in production) |
| Auth | JSON Web Tokens (jsonwebtoken), bcryptjs, Role-Based Access Control |
| Validation | Joi |
| Security | Helmet, CORS, express-rate-limit, parameterized SQL |
| PDF / Reports | pdfkit (PDF), custom CSV serializer |
| AI / Messaging | Rule-based message engine; pluggable Email / WhatsApp Business API transport |
| Dev / Ops | nodemon, Jest, Supertest, Docker & docker-compose, GitHub Actions CI |
| Deployment | Vercel (frontend), Render (backend), Neon (database) |

### Backend npm packages
`express`, `pg`, `jsonwebtoken`, `bcryptjs`, `joi`, `helmet`, `cors`, `express-rate-limit`, `morgan`, `dotenv`, `pdfkit` · dev: `jest`, `supertest`, `nodemon`.

### Frontend npm packages
`react`, `react-dom`, `react-router-dom`, `axios`, `recharts` · dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`.

---

## 3. REST API Reference

Base URL: `/api` · Auth header: `Authorization: Bearer <accessToken>`
Success: `{ "success": true, "data": ..., "meta"?: {...} }` · Error: `{ "success": false, "error": { "message", "details" } }`

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/login | public |
| POST | /api/auth/refresh | public |
| POST | /api/auth/logout | public |
| GET | /api/auth/me | authenticated |
| POST | /api/auth/register | admin |

### Enquiries
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/enquiries `?q=&status=&source=&assigned_staff_id=&page=&limit=` | authenticated |
| GET | /api/enquiries/:id (includes follow-ups + history) | authenticated |
| POST | /api/enquiries | admin, manager, front_desk, corporate |
| PUT | /api/enquiries/:id | admin, manager, front_desk, corporate |
| PATCH | /api/enquiries/:id/status | authenticated |
| PATCH | /api/enquiries/:id/assign | admin, manager |

### Follow-ups
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/follow-ups `?status=&overdue=true&today=true&priority=` | authenticated |
| POST | /api/follow-ups | authenticated |
| PUT | /api/follow-ups/:id | authenticated |
| PATCH | /api/follow-ups/:id/complete | authenticated |
| GET | /api/follow-ups/message/:enquiryId (AI/rule-based message) | authenticated |
| POST | /api/follow-ups/remind (dispatch due reminders) | authenticated |

### Rooms & Availability
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/rooms `?status=&room_type=&hk_status=` | authenticated |
| GET | /api/rooms/availability `?check_in=&check_out=&room_type=` | authenticated |
| GET | /api/rooms/:id | authenticated |
| POST | /api/rooms | admin, manager |
| PUT | /api/rooms/:id | admin, manager |
| PATCH | /api/rooms/:id/status | authenticated |
| DELETE | /api/rooms/:id | admin |

### Bookings
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/bookings `?status=&room_id=&guest_id=` | authenticated |
| GET | /api/bookings/:id | authenticated |
| POST | /api/bookings | admin, manager, front_desk |
| POST | /api/bookings/from-enquiry/:enquiryId | admin, manager, front_desk |
| PATCH | /api/bookings/:id/check-in | admin, manager, front_desk |
| PATCH | /api/bookings/:id/check-out | admin, manager, front_desk |

### Payments & GST
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/payments `?status=&method=&booking_id=&date=` | authenticated |
| GET | /api/payments/settlement `?date=` (daily revenue + GST) | admin, manager, accounts |
| GET | /api/payments/:id | authenticated |
| GET | /api/payments/:id/invoice (GST invoice PDF) | authenticated |
| POST | /api/payments | admin, manager, accounts, front_desk |

### Rate Plans (Seasonal Pricing)
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/rate-plans `?room_type=&is_active=` | authenticated |
| GET | /api/rate-plans/resolve `?room_type=&date=` (effective rate) | authenticated |
| GET | /api/rate-plans/:id | authenticated |
| POST | /api/rate-plans | admin, manager |
| PUT | /api/rate-plans/:id | admin, manager |
| DELETE | /api/rate-plans/:id | admin |

### Dashboard & Reports
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/dashboard/summary | authenticated |
| GET | /api/dashboard/charts | authenticated |
| GET | /api/dashboard/activity | authenticated |
| GET | /api/reports/:type `?format=csv\|pdf` (enquiry/booking/occupancy/revenue/followup/complaint) | admin, manager, accounts |

### Generic CRUD resources
Each supports `GET /` (list with `?q=&page=&limit=` + filters), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` (role-gated):

`/api/users` · `/api/guests` · `/api/self-checkins` · `/api/room-service` · `/api/housekeeping` · `/api/feedback` · `/api/complaints` · `/api/corporate-bookings` · `/api/group-bookings` · `/api/shift-handovers`

### Utility
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /health | Service health check |

---

## 4. External APIs / Integrations

| Integration | Status | Used for |
|---|---|---|
| Neon PostgreSQL | Active | Managed serverless database |
| WhatsApp Business API | Integration-ready (transport hook in `services/messaging.js`) | Follow-up messages, confirmations, reminders |
| Email API (SMTP/provider) | Integration-ready (transport hook) | Reminders, confirmations, invoices |
| OpenAI / LLM (optional) | Optional hook | AI-generated follow-up messages & summaries |

> The messaging service ships a working rule-based generator and a logging transport; production WhatsApp/Email/LLM providers drop into the documented hook points without changing call sites.

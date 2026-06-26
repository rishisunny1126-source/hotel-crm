# Testing Documentation

## Strategy
| Layer | Tooling | Scope |
|-------|---------|-------|
| Unit | Jest | Pure functions & middleware (token, ApiError, RBAC, validation) |
| Integration / API | Jest + Supertest | HTTP endpoints against a real PostgreSQL test DB |
| UI | esbuild transform check + manual flows (Cypress-ready) | Component render & user flows |
| Static | `node --check`, esbuild | Syntax/transform validation of every source file |

Run backend tests: `cd backend && npm test` (needs `DATABASE_URL`, `JWT_SECRET`).
DB-dependent suites auto-skip when `DATABASE_URL` is unset, so unit tests always run.

## Test Cases (representative)
### Authentication
- TC-A1 Valid login returns access + refresh token and user object. (200)
- TC-A2 Invalid password rejected. (401)
- TC-A3 Inactive user cannot log in. (401)
- TC-A4 Access to protected route without token. (401)
- TC-A5 Expired access token auto-refreshed via refresh token.
- TC-A6 Refresh with revoked token rejected. (401)

### RBAC
- TC-R1 Admin can create users. (201)
- TC-R2 Front desk cannot create rooms. (403)
- TC-R3 Accounts can read reports, cannot edit rooms. (403)

### Enquiry CRM
- TC-E1 Create enquiry writes a `created` history row.
- TC-E2 Status change writes `status_changed` with from/to.
- TC-E3 Invalid email/mobile rejected with field-level details. (400)
- TC-E4 Search by mobile returns matching enquiries.
- TC-E5 Assign enquiry records `assigned` history event.

### Bookings & Availability
- TC-B1 Convert enquiry → booking creates guest, booking, flips enquiry to confirmed.
- TC-B2 Overlapping booking on same room rejected by exclusion constraint. (409)
- TC-B3 Availability excludes rooms with overlapping reserved/checked-in bookings.
- TC-B4 Check-out sets room to cleaning, creates housekeeping task, bumps loyalty.

### Reports
- TC-RP1 CSV export returns `text/csv` with attachment header.
- TC-RP2 Unknown report type returns 404.

## Edge Cases
- Check-out date before check-in (DB CHECK + Joi) → 400.
- Duplicate room number / guest mobile / user email → 409.
- Pagination beyond last page returns empty array, correct `meta.total`.
- Body larger than 1 MB rejected.
- Rapid repeated logins throttled by rate limiter. (429)

## Bug / QA Checklist
- [ ] All migrations apply cleanly on an empty DB.
- [ ] Seed creates 6 role users, 12 rooms, demo enquiries.
- [ ] JWT expiry honored; refresh rotation works.
- [ ] Every mutating endpoint enforces RBAC.
- [ ] No raw string interpolation in SQL (parameterized only).
- [ ] Helmet headers present on all responses.
- [ ] CORS limited to CLIENT_URL.
- [ ] 404 and error envelopes consistent `{success,error:{message,details}}`.
- [ ] Frontend refresh-token interceptor redirects to /login on hard 401.
- [ ] Role-gated nav items hidden for unauthorized roles.

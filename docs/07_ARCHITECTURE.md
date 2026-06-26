# System Architecture

## High level
```
React (Vite, Tailwind, Recharts)  --HTTPS/JSON-->  Express REST API  --SQL-->  PostgreSQL (Neon)
        Vercel                                          Render                     Neon
```

## Backend layering
```
routes → middleware (auth, rbac, validate, rateLimit) → controllers → SQL (pg, parameterized) → PostgreSQL
                                                              ↘ utils (token, ApiError, crudFactory)
error middleware normalizes every failure into a JSON envelope.
```
- **Stateless auth**: short-lived JWT access token + rotating refresh token (hash stored in `refresh_tokens`).
- **RBAC**: `authorize(...roles)` guards each mutating route.
- **CRUD factory**: one parameterized, paginated, searchable controller generator powers 10 simple modules; complex modules (enquiry, booking, follow-up, room, dashboard, report) are hand-written for business logic and audit logging.

## Frontend layering
```
main → AuthProvider (context) → Router → ProtectedRoute → Layout(sidebar/topbar) → Pages
pages → api/client (axios + refresh interceptor) → backend
ResourcePage = config-driven table+modal CRUD engine reused across modules.
```

## Security
JWT auth, RBAC, bcrypt(12) hashing, Joi input validation, parameterized SQL (injection-safe), Helmet headers (XSS/clickjacking), CORS allow-list, body-size limit, global + per-route rate limiting.

## Sitemap
`/login` · `/` Dashboard · `/enquiries` · `/follow-ups` · `/rooms` · `/availability` · `/bookings` · `/self-checkins` · `/room-service` · `/housekeeping` · `/feedback` · `/complaints` · `/corporate` · `/groups` · `/guests` · `/handovers` · `/reports` · `/users`

## Key user flow — enquiry to revenue
```
Capture enquiry → assign staff → schedule follow-up → update status
   → check availability → convert to booking → check-in → check-out
   → loyalty + feedback. Every step appended to enquiry_history (audit trail).
```

## Responsive strategy
Mobile-first Tailwind; sidebar collapses to a drawer under `lg`; tables scroll horizontally; KPI grid reflows 2→3→5 columns.

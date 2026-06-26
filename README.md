# Hotel Enquiry & Follow-Up CRM

A production-grade hotel operations CRM: centralizes guest enquiries from every channel,
drives them through a follow-up pipeline to confirmed bookings, and manages rooms,
housekeeping, room service, complaints, feedback, corporate/group bookings, loyalty,
shift handovers and reporting — with JWT auth and role-based access control.

## Stack
React + Vite + Tailwind + Recharts · Node + Express · PostgreSQL (Neon) · JWT + RBAC
Deploy: Vercel (web) · Render (api) · Neon (db) · GitHub Actions CI.

## Modules (18)
Auth · Dashboard · Enquiry CRM · Follow-ups · Enquiry History Timeline · Rooms ·
Availability · Bookings · Self check-in · Room service · Housekeeping · Feedback ·
Complaints · Corporate bookings · Group bookings · Loyalty · Shift handover · Reports.

## Roles
admin · manager · front_desk · housekeeping · accounts · corporate_coordinator

## Quick start
```bash
# Backend
cd backend && npm install && cp .env.example .env   # set DATABASE_URL + JWT secrets
npm run migrate && npm run seed && npm run dev       # :5000
# Frontend
cd ../frontend && npm install && cp .env.example .env
npm run dev                                          # :5173
```
Demo login: `admin@hotel.com` / `Password@123` (all six roles share this password).
Or run everything with Docker: `docker compose up --build`.

## Repository layout
```
backend/   Express API, SQL migrations, seed, tests
frontend/  React (Vite) SPA
docs/      Architecture, DB design, API, testing, deployment, user manual, project report
.github/   CI workflow
```

## Documentation
See `docs/` — `07_ARCHITECTURE.md`, `08_DATABASE.md`, `09_API.md`, `11_TESTING.md`,
`12_DEPLOYMENT.md`, `13_USER_MANUAL.md`, and `PROJECT_REPORT.md`.

## Problems solved
Scattered enquiries, lost room/date/budget requirements, forgotten follow-ups and lost
revenue, unclear ownership, no history, fragmented front-desk data, hard-to-monitor room
availability, untracked room service/housekeeping, disorganized feedback/complaints,
unmanaged corporate/group bookings, missing loyalty, lost shift handovers, and thin
reporting — each maps to a module above.

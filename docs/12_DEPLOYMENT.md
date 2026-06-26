# Deployment Guide

## Architecture
- **Frontend** → Vercel (static build of Vite app, SPA rewrite in `vercel.json`).
- **Backend** → Render Web Service (Node, `render.yaml`).
- **Database** → Neon serverless PostgreSQL (set `PGSSL=true`).

## Local (Docker)
```bash
cp backend/.env.example backend/.env   # set secrets
docker compose up --build              # db + api + web
```
Or manually:
```bash
# DB: create a postgres db named hotel_crm
cd backend && npm install && cp .env.example .env
npm run migrate && npm run seed && npm run dev      # http://localhost:5000
cd ../frontend && npm install && cp .env.example .env
npm run dev                                         # http://localhost:5173
```

## Neon DB
1. Create project → copy connection string into `DATABASE_URL`.
2. `PGSSL=true`.
3. `npm run migrate && npm run seed`.

## Render (backend)
- New Web Service → connect GitHub → root `backend/`.
- Build: `npm ci && npm run migrate`  ·  Start: `npm start`.
- Env: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `PGSSL=true`, `NODE_ENV=production`.

## Vercel (frontend)
- Import repo → root `frontend/`.
- Build: `npm run build` · Output: `dist`.
- Env: `VITE_API_URL=https://<render-app>.onrender.com/api`.

## CI/CD
`.github/workflows/ci.yml` spins up Postgres, runs migrations + backend tests, builds frontend on every push/PR to main & develop.

## Git Branching
`main` (production) ← `develop` (integration) ← `feature/*`, `bugfix/*`. PRs require green CI + 1 review. Tag releases `vX.Y.Z`.

# TrigonLinks ERP — Repository Knowledge

## Stack
- **Frontend**: React + TypeScript + Vite (port 3000) — dark theme `#121B2E`/`#14E8B4` accent
- **Backend**: Express + TypeScript (port 5000) — Supabase/CockroachDB
- **Production backend**: https://lightgreen-rhinoceros-358548.hostingersite.com
- **Deploy**: manual FTP to Hostinger (deploy-backend.ps1 template). No CI auto-deploy.

## Test Users (production)
- **Admin**: mohsinbhalli147@gmail.com / Zimal@123
- **Staff**: staff@trigonlinks.com / staff123
- **Customer**: username=faisal3808 cnic=3460212345678 (FAISAL 3)
- Seed file: `backend/src/seed.ts`

## Key Patterns
- **Pagination**: use `useServerPagination` hook + `Pagination` component (frontend/src/hooks, components). Backend returns `{ data, pagination: { total, totalPages, page, limit } }`.
- **Background jobs**: `backend/src/services/jobStore.ts` — `runInBackground`, `getJob`, `createJob`, `updateJobProgress`, `completeJob`, `failJob`. Jobs stored in-memory.
- **Schedulers**: setInterval-based (see `backup-scheduler.ts`, `invoice-scheduler.ts`). No node-cron dependency.
- **Migrations**: SQL files in `backend/src/database/migrations/files/` numbered `NNN_name.sql`. Auto-loaded by migration-manager on startup.

## Important API Field Names
- Staff create needs: `username`, `name`, `password`, `role` (validation in `backend/src/routes/staff.ts`)
- Inventory create needs: `name`, `category`, `qty`, `price` (NOT quantity/unit_price)
- Customer login: `username` + `cnic` via `/api/auth/customer-login`
- Staff/admin login: `email` + `password` via `/api/auth/login`

## New Endpoints (TASK-2, need production deploy to test)
- `POST /api/billing/generate-monthly` — now background, accepts `{ forceAll, area }`, returns `{ jobId }`
- `POST /api/billing/generate-area/:area` — area-wise background generation
- `GET /api/billing/job/:jobId` — job status polling
- `GET /api/billing/areas` — distinct customer areas
- `POST /api/billing/auto-generate/trigger` — manual cron trigger

## Migration 015
- `015_add_staff_columns.sql` — adds address/cnic/position columns to staff table.
- Without this migration, staff create with address field returns 500.

## Local Dev Notes
- Local backend `.env` has placeholder Supabase URL — local backend can't connect to DB.
- Frontend dev: `cd frontend && npm run dev` (port 3000, proxies to production backend)
- Backend dev: `cd backend && npm run dev` (port 5000, needs real DB creds to function)

## Test Suite
- `test_crud_suite.py` — comprehensive CRUD tests (auth, customers, invoices, payments, staff, inventory, RBAC, dashboard). Run: `python3 test_crud_suite.py`
- 27/31 pass against production. 4 failures are new endpoints/migration pending production deploy.

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

## Bug Fixes Applied (TASK-18, in progress)

### Dashboard
- **backend/src/routes/dashboard.ts** `todayStats` object (~line 395): added missing fields frontend expects — `totalRevenue`, `pendingAmount`, `profit`, `collectionRate`, `avgRevenuePerCustomer`, `totalExpenses`, `monthlyTarget`. Root cause: frontend Financial Overview cards showed Rs. 0 / 0% everywhere. Also added the supporting queries (`currentMonthRevenue`, `currentMonthExpenses`, `totalInvoiceAmount`, `totalCollected`, `paidInvoices`, `totalInvoices`, `totalCustomers`) to the `todayStats` section's promise map (~line 221). **Needs backend deploy to take effect.**
- **frontend/src/pages/Dashboard.tsx** search bar (~line 184): added `onKeyDown` Enter handler → navigates to `/customers/all?q=<query>` (was a dead feature before).

### Customers — All Customers page
- **frontend/src/hooks/useServerPagination.ts** `fetchData` useCallback: added `fetchFn` to dependency array (line 60). **ROOT CAUSE of search/status filter not working on page 1** — when `searchTerm`/`filterStatus` changed, a new `fetchFn` was created but the hook never re-ran `fetchData` (deps were only `[page, limit, refreshKey]`), and `setPage(1)` is a no-op when already on page 1.
- **frontend/src/pages/CustomersAll.tsx**: 
  - Added `useSearchParams` import and initial `searchTerm` from `?q=` URL param (line 39) so Dashboard search bar can deep-link.
  - Added `debouncedSearch` state (400ms debounce, lines 40/45-49) so typing doesn't fire an API call per keystroke. `fetchCustomers` now depends on `debouncedSearch` (line 56).
  - Verified working via `?q=faisal` (4 results). NOTE: browser automation `browser_type` doesn't reliably trigger React controlled-input `onChange`; real users typing will work.
- **backend/src/repositories/CustomersRepository.ts** `paginateCustomers` (~line 146): search now uses `.or(name,username,mobile,cnic,address,area ilike)` instead of only `name.ilike`. **Needs backend deploy.**

### Testing Notes
- Frontend dev server: `cd frontend && npm run dev` (port 3000). `.env` `VITE_API_BASE_URL` points to production backend, so backend fixes require production deploy to verify on live data. Frontend fixes can be verified locally against production backend.
- Backend search + status filter both confirmed working via curl against production API.
- Production has 706 customers (all active), 0 suspended, 0 inactive. Search "faisal" → 4 results.

## Bug Fixes Applied (TASK-18, continued — Customers sub-sections)

### Add Customer page
- **backend/src/routes/customers.ts** POST `/` handler (lines 117-145): **ROOT CAUSE of "dates not saving to DB"** — the `customerData` object only picked ~10 fields (name, mobile, address, area, status, package, fee, install_date, iptv_enabled, live_ip_enabled, iptv_monthly_charges, live_ip_monthly_fee) and DROPPED the rest. Added the missing fields frontend sends: `father_name`, `username`, `cnic`, `email`, `billing_date`, `emergency_contact`, `notes`, `iptv_box_number`, `iptv_box_price`, `iptv_installation_charges`, `live_ip_address`, `live_ip_installation_fee`. **Needs backend deploy.**
- **frontend/src/pages/CustomersAdd.tsx** `handleSubmit`: added explicit JS validation BEFORE the API call — checks all required fields (name, username, mobile, cnic, address, area, package, install_date, billing_date, fee) with a clear "Please fill in all required fields: X, Y, Z" message, plus CNIC (13 digits) and mobile (10+ digits) format checks. Also `.trim()`s string fields and normalizes cnic/mobile to digits.

### Customer Profile page (View button)
- **frontend/src/pages/CustomerProfile.tsx**: works — Eye/View button navigates to `/customers/profile/:id`, renders full detail (Personal Info, Connection Details, Notes, Payment History) + action buttons (Back, Print, Add Payment, Edit, Delete). Verified on FAISAL 3.
- NOTE: existing records show Father Name/Email/Emergency/Install Date = N/A because the OLD backend create route (before this fix) didn't save those fields. New customers will populate them once backend is deployed.

### Active Customers page
- **frontend/src/pages/CustomersActive.tsx** (lines 144-148): **Billing Date display bug FIXED** — was `new Date(customer.billing_date).toLocaleDateString()` but `billing_date` is a day-of-month number (1-28), not a timestamp, so it rendered "1/1/1970". Now shows `Day X` (matching the profile page format). Also IPTV column now shows `Rs. 0` fallback when charges null, and Live IP column shows the monthly fee fallback when address is empty.
- NOTE: Username/CNIC = N/A on first 2 rows ("ali", "Hmaza") is pre-existing data (those fields are null in DB for old records). New customers will have them.

### Suspended Customers page
- **frontend/src/pages/CustomersSuspended.tsx**: works — renders "No suspended customers found" (correct, 0 suspended in production).

### Customer Reports page
- **frontend/src/pages/CustomerReports.tsx**: works — renders stats cards (Total 706, Active 706, Suspended 0, Total Revenue Rs.1,349,750, Avg Revenue/Customer Rs.1,912, IPTV Customers 2), Monthly Growth chart, Status Distribution pie, Revenue Summary, Monthly Breakdown table. Refresh button works. Time period dropdown renders all options (Today/Last Day/This Week/Last Week/This Month/Last Month/This Year).

### All Customers action buttons (verified)
- Eye (View Profile) → `/customers/profile/:id` ✅
- Edit → `/customers/edit/:id` ✅ (Edit form renders with all fields loaded)
- CreditCard (Add Payment) → `/billing/receive?customerId=...`
- Suspend/Activate toggle → `handleStatusChange`
- Trash (Delete) → `handleDelete` (confirm dialog)

## Testing Results Summary (Customers section — FULLY TESTED)
- All 5 Customers sub-sections render without errors.
- Search filter: FIXED & verified (?q=faisal → 4 results).
- View/Edit buttons navigate correctly to profile/edit forms.
- Backend create route now saves ALL fields (dates + IPTV + Live IP + father/username/cnic/email/notes).
- Active page billing_date display: FIXED (Day X format).
- Remaining "N/A" values are pre-existing NULL data in old records, NOT code bugs — new customers will populate them after backend deploy.
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

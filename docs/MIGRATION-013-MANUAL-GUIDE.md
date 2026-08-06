# Migration 013 Manual Execution Guide

**Purpose:** This guide provides instructions for manually executing Migration 013 (Phase 2 Advanced Customer Management) if the automatic migration system fails due to database connectivity issues.

## Prerequisites

1. **Supabase Database Access**
   - Supabase project URL
   - Database credentials (password)
   - SQL Editor access in Supabase Dashboard

2. **Migration File Location**
   - File: `backend/src/database/migrations/files/013_phase2_advanced_customer_management.sql`
   - This file contains all SQL statements for Phase 2 tables

## Option 1: Execute via Supabase SQL Editor (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to open a new SQL editor window

### Step 2: Load Migration SQL
1. Open the migration file: `backend/src/database/migrations/files/013_phase2_advanced_customer_management.sql`
2. Copy the entire content of the file
3. Paste it into the Supabase SQL Editor

### Step 3: Execute Migration
1. Click **Run** (or press Ctrl+Enter) to execute the SQL
2. Monitor the output for any errors
3. Verify all tables were created successfully

### Step 4: Verify Migration Success
Run this verification query in the SQL Editor:

```sql
-- Check if Phase 2 tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'customer_tags',
    'customer_labels', 
    'customer_documents',
    'customer_notes',
    'staff_notes',
    'family_accounts',
    'family_members',
    'customer_activity_timeline',
    'saved_filters',
    'bulk_operations',
    'bulk_operation_results',
    'customer_package_history',
    'customer_connection_history'
)
ORDER BY table_name;
```

Expected result: 14 tables listed

### Step 5: Verify New Columns
```sql
-- Check if new columns were added to customers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('rating', 'priority', 'last_activity_at')
ORDER BY column_name;
```

Expected result: 3 columns (rating, priority, last_activity_at)

```sql
-- Check if new columns were added to connections table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'connections' 
AND column_name IN ('is_primary', 'connection_type')
ORDER BY column_name;
```

Expected result: 2 columns (is_primary, connection_type)

## Option 2: Execute via psql Command Line

### Step 1: Get Database Connection String
From your Supabase project settings:
1. Go to **Settings** → **Database**
2. Copy the **Connection String** (URI format)
3. It should look like: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`

### Step 2: Install psql (if not installed)
- **Windows:** Download from PostgreSQL official site
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql-client`

### Step 3: Execute Migration
```bash
psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" -f backend/src/database/migrations/files/013_phase2_advanced_customer_management.sql
```

### Step 4: Verify
Run the verification queries from Option 1, Step 4 and Step 5.

## Option 3: Fix Database Connection and Restart Server

### Step 1: Check Environment Variables
Verify your `.env` file in the backend directory contains correct values:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
```

### Step 2: Test Database Connection
```bash
# From backend directory
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { console.log(err || res.rows[0]); pool.end(); });"
```

### Step 3: Restart Backend Server
```bash
# Stop current server (Ctrl+C)
# Then restart
cd backend
npm run dev
```

### Step 4: Monitor Migration Logs
Watch for successful migration messages:
```
[INFO] Executing migration: phase2_advanced_customer_management (v13)
[INFO] Migration phase2_advanced_customer_management completed successfully
```

## Troubleshooting

### Issue: "relation already exists"
**Cause:** Migration already partially executed
**Solution:** Check which tables exist and manually drop them before re-running:

```sql
-- Drop existing Phase 2 tables (use with caution)
DROP TABLE IF EXISTS customer_connection_history CASCADE;
DROP TABLE IF EXISTS customer_package_history CASCADE;
DROP TABLE IF EXISTS bulk_operation_results CASCADE;
DROP TABLE IF EXISTS bulk_operations CASCADE;
DROP TABLE IF EXISTS saved_filters CASCADE;
DROP TABLE IF EXISTS customer_activity_timeline CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS family_accounts CASCADE;
DROP TABLE IF EXISTS staff_notes CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS customer_documents CASCADE;
DROP TABLE IF EXISTS customer_labels CASCADE;
DROP TABLE IF EXISTS customer_tags CASCADE;
```

### Issue: "column already exists"
**Cause:** Columns already added to existing tables
**Solution:** Skip the ALTER TABLE statements in the migration file or drop columns first:

```sql
-- Drop new columns from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS rating;
ALTER TABLE customers DROP COLUMN IF EXISTS priority;
ALTER TABLE customers DROP COLUMN IF EXISTS last_activity_at;

-- Drop new columns from connections table  
ALTER TABLE connections DROP COLUMN IF EXISTS is_primary;
ALTER TABLE connections DROP COLUMN IF EXISTS connection_type;
```

### Issue: Permission denied
**Cause:** Insufficient database permissions
**Solution:** Ensure you're using the postgres user or a user with sufficient privileges

### Issue: Network connectivity
**Cause:** Firewall or network blocking database connection
**Solution:** 
1. Check if you can access Supabase from your network
2. Try accessing Supabase Dashboard to verify connectivity
3. Check if VPN or firewall is blocking the connection

## Post-Migration Steps

After successful migration:

1. **Restart Backend Server** (if not already running)
2. **Verify API Endpoints** are accessible:
   ```bash
   curl http://localhost:5000/api/customers/advanced/tags/all
   ```
3. **Test Frontend** by navigating to new Phase 2 pages:
   - `/customers/profile-advanced/:id`
   - `/customers/bulk-operations`
   - `/customers/advanced-search`
   - `/customers/export`

## Rollback (If Needed)

If you need to rollback Migration 013:

```sql
-- Rollback SQL
DROP TABLE IF EXISTS customer_connection_history CASCADE;
DROP TABLE IF EXISTS customer_package_history CASCADE;
DROP TABLE IF EXISTS bulk_operation_results CASCADE;
DROP TABLE IF EXISTS bulk_operations CASCADE;
DROP TABLE IF EXISTS saved_filters CASCADE;
DROP TABLE IF EXISTS customer_activity_timeline CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS family_accounts CASCADE;
DROP TABLE IF EXISTS staff_notes CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS customer_documents CASCADE;
DROP TABLE IF EXISTS customer_labels CASCADE;
DROP TABLE IF EXISTS customer_tags CASCADE;

-- Remove new columns from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS rating;
ALTER TABLE customers DROP COLUMN IF EXISTS priority;
ALTER TABLE customers DROP COLUMN IF EXISTS last_activity_at;

-- Remove new columns from connections table
ALTER TABLE connections DROP COLUMN IF EXISTS is_primary;
ALTER TABLE connections DROP COLUMN IF EXISTS connection_type;

-- Drop view
DROP VIEW IF EXISTS advanced_customer_summary;

-- Drop functions
DROP FUNCTION IF EXISTS log_customer_activity CASCADE;
DROP FUNCTION IF EXISTS update_customer_last_activity CASCADE;
DROP FUNCTION IF EXISTS trigger_update_customer_last_activity CASCADE;
```

## Support

If you encounter issues not covered in this guide:

1. Check the backend server logs for detailed error messages
2. Review the migration SQL file for any syntax issues
3. Verify your Supabase database is accessible via the Dashboard
4. Contact support with the specific error message and context

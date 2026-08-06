# Migration 013 Manual Execution Instructions

**Status:** Ready for Manual Execution  
**Migration File:** `backend/src/database/migrations/files/013_phase2_advanced_customer_management.sql`  
**Total Lines:** 385

## Immediate Steps

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query** to open a new SQL editor window

### Step 2: Copy Migration SQL
The migration SQL file is located at:
```
backend/src/database/migrations/files/013_phase2_advanced_customer_management.sql
```

You can copy the entire file content (385 lines) from your IDE.

### Step 3: Execute Migration
1. Paste the entire SQL content into the Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait for execution to complete
4. Check for any errors in the output

### Step 4: Verify Migration Success

After execution, run these verification queries in the SQL Editor:

**Query 1: Check Phase 2 Tables**
```sql
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

**Expected Result:** 14 tables listed

**Query 2: Check New Columns in customers Table**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('rating', 'priority', 'last_activity_at')
ORDER BY column_name;
```

**Expected Result:** 3 columns (rating, priority, last_activity_at)

**Query 3: Check New Columns in connections Table**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'connections' 
AND column_name IN ('connection_type', 'is_active', 'suspended_at', 'suspended_by', 'suspension_reason')
ORDER BY column_name;
```

**Expected Result:** 5 columns

**Query 4: Check View Created**
```sql
SELECT view_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND view_name = 'customer_summary_advanced';
```

**Expected Result:** 1 view (customer_summary_advanced)

**Query 5: Check Functions Created**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_customer_activity', 'update_customer_last_activity')
ORDER BY routine_name;
```

**Expected Result:** 2 functions

**Query 6: Check Triggers Created**
```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'trg_update_customer_last_activity';
```

**Expected Result:** 1 trigger

## Migration Summary

**Tables Created:** 14
1. customer_tags
2. customer_labels
3. customer_documents
4. customer_notes
5. staff_notes
6. family_accounts
7. family_members
8. customer_activity_timeline
9. saved_filters
10. bulk_operations
11. bulk_operation_results
12. customer_package_history
13. customer_connection_history
14. customer_summary_advanced (view)

**Columns Added:** 8
- customers: rating, priority, last_activity_at (3 columns)
- connections: connection_type, is_active, suspended_at, suspended_by, suspension_reason (5 columns)

**Functions Created:** 2
- log_customer_activity
- update_customer_last_activity

**Triggers Created:** 1
- trg_update_customer_last_activity

**Views Created:** 1
- customer_summary_advanced

**Indexes Created:** Multiple (included in table definitions)

**RLS Policies:** 14 tables with RLS enabled

## Troubleshooting

### If you get "relation already exists" errors
This means some tables already exist. You can either:
1. Skip the errors (tables are already created)
2. Drop existing tables first (use with caution)

### If you get "column already exists" errors
This means columns are already added. You can skip these errors.

### If you get permission errors
Ensure you're logged in as the database owner or have sufficient privileges.

## After Successful Migration

Once you confirm all verification queries return expected results:

1. **Restart Backend Server**
   - Stop current backend (Ctrl+C in terminal)
   - Restart with `npm run dev`
   - Check logs for migration status

2. **Notify Cascade**
   - Confirm migration executed successfully
   - Share verification results
   - Cascade will proceed with API and frontend testing

## Contact

If you encounter any issues not covered here, share the error message and Cascade will help troubleshoot.

-- Drop all tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;

-- Drop views
DROP VIEW IF EXISTS customer_summary CASCADE;
DROP VIEW IF EXISTS area_summary CASCADE;
DROP VIEW IF EXISTS staff_performance CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_invoice_number CASCADE;
DROP FUNCTION IF EXISTS update_expense_category_spent CASCADE;
DROP FUNCTION IF EXISTS update_inventory_quantity CASCADE;
DROP FUNCTION IF EXISTS mark_overdue_invoices CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS account_status CASCADE;
DROP TYPE IF EXISTS connection_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS complaint_status CASCADE;
DROP TYPE IF EXISTS complaint_priority CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

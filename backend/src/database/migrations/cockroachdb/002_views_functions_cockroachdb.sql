-- Migration 002: Views, Functions, and Triggers (CockroachDB Compatible)
-- This migration creates database views and functions for TrigonLinks ERP
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- Note: SECURITY DEFINER removed (CockroachDB uses role-based security)
-- Note: Triggers will be handled in application layer
-- Note: current_setting() will be replaced with session variables

-- Drop existing views/functions if they exist (for idempotency)
DROP VIEW IF EXISTS staff_performance CASCADE;
DROP VIEW IF EXISTS area_summary CASCADE;
DROP VIEW IF EXISTS customer_summary CASCADE;

DROP FUNCTION IF EXISTS cleanup_expired_notifications() CASCADE;
DROP FUNCTION IF EXISTS mark_overdue_invoices() CASCADE;
DROP FUNCTION IF EXISTS update_inventory_quantity() CASCADE;
DROP FUNCTION IF EXISTS update_expense_category_spent() CASCADE;
DROP FUNCTION IF EXISTS set_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;

-- Note: Triggers are not created here - logic moved to application layer
-- DROP TRIGGER IF EXISTS trg_update_inventory_quantity ON inventory_transactions;
-- DROP TRIGGER IF EXISTS trg_update_expense_category_spent ON expenses;
-- DROP TRIGGER IF EXISTS trg_set_invoice_number ON invoices;

-- Create type for customer summary (CockroachDB compatible)
CREATE TYPE customer_summary_type AS (
    id UUID,
    uid VARCHAR,
    name VARCHAR,
    mobile VARCHAR,
    area VARCHAR,
    status VARCHAR,
    package VARCHAR,
    fee DECIMAL,
    total_invoices BIGINT,
    paid_invoices BIGINT,
    unpaid_invoices BIGINT,
    outstanding_balance DECIMAL,
    total_paid DECIMAL
);

-- Create type for area summary (CockroachDB compatible)
CREATE TYPE area_summary_type AS (
    id UUID,
    name VARCHAR,
    status VARCHAR,
    total_customers BIGINT,
    active_customers BIGINT,
    monthly_revenue DECIMAL,
    total_connections BIGINT,
    approved_connections BIGINT
);

-- Create type for staff performance (CockroachDB compatible)
CREATE TYPE staff_performance_type AS (
    id UUID,
    name VARCHAR,
    role VARCHAR,
    status VARCHAR,
    assigned_area VARCHAR,
    total_connections BIGINT,
    total_collections DECIMAL,
    total_payments BIGINT
);

-- Create function for customer summary without SECURITY DEFINER
-- Note: Security will be handled at application level
CREATE OR REPLACE FUNCTION get_customer_summary_data(current_user_id_param UUID, current_user_role_param VARCHAR)
RETURNS SETOF customer_summary_type AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.uid,
        c.name,
        c.mobile,
        c.area,
        c.status,
        c.package,
        c.fee,
        COUNT(DISTINCT i.id) as total_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as paid_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'unpaid' THEN i.id END) as unpaid_invoices,
        COALESCE(SUM(i.remaining_balance), 0) as outstanding_balance,
        COALESCE(SUM(i.paid_amount), 0) as total_paid
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    WHERE (
        current_user_role_param = 'admin'
        OR current_user_role_param = 'staff'
        OR c.uid = (SELECT uid FROM users WHERE id = current_user_id_param LIMIT 1)
    )
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- Customer summary view
CREATE VIEW customer_summary AS
SELECT * FROM get_customer_summary_data(NULL::UUID, NULL::VARCHAR);

-- Create function for area summary without SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_area_summary_data(current_user_role_param VARCHAR)
RETURNS SETOF area_summary_type AS $$
BEGIN
    -- Only admins and staff can view area summaries
    IF current_user_role_param NOT IN ('admin', 'staff') THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.status,
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_customers,
        COALESCE(SUM(c.fee), 0) as monthly_revenue,
        COUNT(DISTINCT conn.id) as total_connections,
        COUNT(DISTINCT CASE WHEN conn.status = 'approved' THEN conn.id END) as approved_connections
    FROM areas a
    LEFT JOIN customers c ON a.name = c.area
    LEFT JOIN connections conn ON a.name = conn.area
    GROUP BY a.id;
END;
$$ LANGUAGE plpgsql;

-- Area summary view
CREATE VIEW area_summary AS
SELECT * FROM get_area_summary_data(NULL::VARCHAR);

-- Create function for staff performance without SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_staff_performance_data(current_user_id_param UUID, current_user_role_param VARCHAR)
RETURNS SETOF staff_performance_type AS $$
BEGIN
    -- Only admins and staff can view staff performance
    IF current_user_role_param NOT IN ('admin', 'staff') THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.role,
        s.status,
        s.assigned_area,
        COUNT(DISTINCT CASE WHEN conn.status = 'approved' THEN conn.id END) as total_connections,
        COALESCE(SUM(p.amount), 0) as total_collections,
        COUNT(DISTINCT p.id) as total_payments
    FROM staff s
    LEFT JOIN connections conn ON s.id = conn.assigned_staff
    LEFT JOIN payments p ON s.id = p.collected_by
    WHERE (
        current_user_role_param = 'admin'
        OR s.uid = (SELECT uid FROM users WHERE id = current_user_id_param LIMIT 1)
    )
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql;

-- Staff performance view
CREATE VIEW staff_performance AS
SELECT * FROM get_staff_performance_data(NULL::UUID, NULL::VARCHAR);

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    invoice_num VARCHAR;
    date_part VARCHAR;
    seq_part INTEGER;
BEGIN
    date_part := TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMM');
    SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1
    INTO seq_part
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || date_part || '-%';
    
    invoice_num := 'INV-' || date_part || '-' || LPAD(seq_part::TEXT, 4, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger removed - logic will be moved to application layer
-- CREATE TRIGGER trg_set_invoice_number
--     BEFORE INSERT ON invoices
--     FOR EACH ROW
--     EXECUTE FUNCTION set_invoice_number();

-- Function to update expense category spent amount
-- Note: Trigger removed - logic will be moved to application layer
CREATE OR REPLACE FUNCTION update_expense_category_spent_manual(category_name VARCHAR, amount DECIMAL, operation VARCHAR)
RETURNS VOID AS $$
BEGIN
    IF operation = 'insert' THEN
        UPDATE expense_categories
        SET spent = spent + amount
        WHERE name = category_name;
    ELSIF operation = 'update' THEN
        -- This will be called with old_amount and new_amount from application
        UPDATE expense_categories
        SET spent = spent + amount
        WHERE name = category_name;
    ELSIF operation = 'delete' THEN
        UPDATE expense_categories
        SET spent = spent - amount
        WHERE name = category_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory quantity on transaction
-- Note: Trigger removed - logic will be moved to application layer
CREATE OR REPLACE FUNCTION update_inventory_quantity_manual(item_id_param UUID, quantity_param INTEGER, type_param VARCHAR)
RETURNS VOID AS $$
BEGIN
    IF type_param = 'in' THEN
        UPDATE inventory
        SET qty = qty + quantity_param,
            updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
        WHERE id = item_id_param;
    ELSIF type_param = 'out' THEN
        UPDATE inventory
        SET qty = qty - quantity_param,
            updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
        WHERE id = item_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS BIGINT AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    DELETE FROM notifications
    WHERE created_at < EXTRACT(EPOCH FROM NOW()) * 1000 - (30 * 24 * 60 * 60 * 1000);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS BIGINT AS $$
DECLARE
    updated_count BIGINT;
BEGIN
    UPDATE invoices
    SET status = 'overdue',
        updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
    WHERE status = 'unpaid'
    AND due_date < EXTRACT(EPOCH FROM NOW()) * 1000;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

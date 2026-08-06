-- Migration 002: Views, Functions, and Triggers
-- This migration creates database views, functions, and triggers
-- Version: 1.0.0

-- Drop existing views/functions/triggers if they exist (for idempotency)
DROP VIEW IF EXISTS staff_performance CASCADE;
DROP VIEW IF EXISTS area_summary CASCADE;
DROP VIEW IF EXISTS customer_summary CASCADE;

DROP FUNCTION IF EXISTS cleanup_expired_notifications() CASCADE;
DROP FUNCTION IF EXISTS mark_overdue_invoices() CASCADE;
DROP FUNCTION IF EXISTS update_inventory_quantity() CASCADE;
DROP FUNCTION IF EXISTS update_expense_category_spent() CASCADE;
DROP FUNCTION IF EXISTS set_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;

DROP TRIGGER IF EXISTS trg_update_inventory_quantity ON inventory_transactions;
DROP TRIGGER IF EXISTS trg_update_expense_category_spent ON expenses;
DROP TRIGGER IF EXISTS trg_set_invoice_number ON invoices;

-- Create type for customer summary
CREATE TYPE customer_summary_type AS (
    id UUID,
    uid VARCHAR,
    name VARCHAR,
    mobile VARCHAR,
    area VARCHAR,
    status account_status,
    package VARCHAR,
    fee DECIMAL,
    total_invoices BIGINT,
    paid_invoices BIGINT,
    unpaid_invoices BIGINT,
    outstanding_balance DECIMAL,
    total_paid DECIMAL
);

-- Create type for area summary
CREATE TYPE area_summary_type AS (
    id UUID,
    name VARCHAR,
    status account_status,
    total_customers BIGINT,
    active_customers BIGINT,
    monthly_revenue DECIMAL,
    total_connections BIGINT,
    approved_connections BIGINT
);

-- Create type for staff performance
CREATE TYPE staff_performance_type AS (
    id UUID,
    name VARCHAR,
    role user_role,
    status account_status,
    assigned_area VARCHAR,
    total_connections BIGINT,
    total_collections DECIMAL,
    total_payments BIGINT
);

-- Create SECURITY DEFINER function for customer summary with security checks
CREATE OR REPLACE FUNCTION get_customer_summary_data()
RETURNS SETOF customer_summary_type AS $$
DECLARE
    current_email TEXT;
    current_uid TEXT;
    user_role user_role;
BEGIN
    current_email := current_setting('app.current_email', true);
    current_uid := current_setting('app.current_uid', true);
    
    SELECT role INTO user_role FROM users WHERE email = current_email LIMIT 1;
    
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
        user_role = 'admin'
        OR user_role = 'staff'
        OR c.uid = current_uid
    )
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Customer summary view using SECURITY DEFINER function
CREATE VIEW customer_summary AS
SELECT * FROM get_customer_summary_data();

-- Create SECURITY DEFINER function for area summary with security checks
CREATE OR REPLACE FUNCTION get_area_summary_data()
RETURNS SETOF area_summary_type AS $$
DECLARE
    current_email TEXT;
    user_role user_role;
BEGIN
    current_email := current_setting('app.current_email', true);
    
    SELECT role INTO user_role FROM users WHERE email = current_email LIMIT 1;
    
    -- Only admins and staff can view area summaries
    IF user_role NOT IN ('admin', 'staff') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Area summary view using SECURITY DEFINER function
CREATE VIEW area_summary AS
SELECT * FROM get_area_summary_data();

-- Create SECURITY DEFINER function for staff performance with security checks
CREATE OR REPLACE FUNCTION get_staff_performance_data()
RETURNS SETOF staff_performance_type AS $$
DECLARE
    current_email TEXT;
    current_uid TEXT;
    user_role user_role;
BEGIN
    current_email := current_setting('app.current_email', true);
    current_uid := current_setting('app.current_uid', true);
    
    SELECT role INTO user_role FROM users WHERE email = current_email LIMIT 1;
    
    -- Only admins and staff can view staff performance
    IF user_role NOT IN ('admin', 'staff') THEN
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
        user_role = 'admin'
        OR s.uid = current_uid
    )
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staff performance view using SECURITY DEFINER function
CREATE VIEW staff_performance AS
SELECT * FROM get_staff_performance_data();

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

-- Trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Function to update expense category spent amount
CREATE OR REPLACE FUNCTION update_expense_category_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE expense_categories
        SET spent = spent + NEW.amount
        WHERE name = NEW.category;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE expense_categories
        SET spent = spent - OLD.amount + NEW.amount
        WHERE name = NEW.category;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE expense_categories
        SET spent = spent - OLD.amount
        WHERE name = OLD.category;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_expense_category_spent
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_category_spent();

-- Function to update inventory quantity on transaction
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'in' THEN
            UPDATE inventory
            SET qty = qty + NEW.quantity,
                updated_at = NEW.created_at
            WHERE id = NEW.item_id;
        ELSIF NEW.type = 'out' THEN
            UPDATE inventory
            SET qty = qty - NEW.quantity,
                updated_at = NEW.created_at
            WHERE id = NEW.item_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory_quantity
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_quantity();

-- Function to mark overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    marked_count INTEGER;
BEGIN
    UPDATE invoices
    SET status = 'overdue',
        updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
    WHERE status = 'unpaid'
    AND due_date IS NOT NULL
    AND due_date < EXTRACT(EPOCH FROM NOW()) * 1000;
    
    GET DIAGNOSTICS marked_count = ROW_COUNT;
    RETURN marked_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL
    AND expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

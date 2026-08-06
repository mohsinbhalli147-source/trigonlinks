-- Migration 011: Fix Views with SECURITY DEFINER and Proper Security Checks
-- This migration converts views to SECURITY DEFINER with proper security checks
-- following Supabase security best practices
-- Version: 1.0.0

-- Drop existing views
DROP VIEW IF EXISTS staff_performance CASCADE;
DROP VIEW IF EXISTS area_summary CASCADE;
DROP VIEW IF EXISTS customer_summary CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS staff_performance_type CASCADE;
DROP TYPE IF EXISTS area_summary_type CASCADE;
DROP TYPE IF EXISTS customer_summary_type CASCADE;

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
CREATE OR REPLACE VIEW customer_summary AS
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
CREATE OR REPLACE VIEW area_summary AS
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
CREATE OR REPLACE VIEW staff_performance AS
SELECT * FROM get_staff_performance_data();

-- Grant execute permissions on SECURITY DEFINER functions to authenticated users
GRANT EXECUTE ON FUNCTION get_customer_summary_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_area_summary_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_staff_performance_data() TO authenticated;

-- Grant select permissions on views to authenticated users
GRANT SELECT ON customer_summary TO authenticated;
GRANT SELECT ON area_summary TO authenticated;
GRANT SELECT ON staff_performance TO authenticated;

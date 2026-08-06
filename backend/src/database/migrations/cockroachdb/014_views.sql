-- Migration 014: Views (CockroachDB Compatible)
-- Creating views for customer_summary, area_summary, staff_performance

-- Note: SECURITY DEFINER not supported in CockroachDB
-- Security will be handled at application layer

-- Customer summary view
CREATE OR REPLACE VIEW customer_summary AS
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
GROUP BY c.id;

-- Area summary view
CREATE OR REPLACE VIEW area_summary AS
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

-- Staff performance view
CREATE OR REPLACE VIEW staff_performance AS
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
GROUP BY s.id;
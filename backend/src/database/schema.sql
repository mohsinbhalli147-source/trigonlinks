-- TrigonLinks ERP PostgreSQL Schema
-- Migrated from Firebase Firestore to Supabase PostgreSQL
-- Supports 5,000+ customers with 50-100 concurrent users

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer', 'manager', 'technician', 'collector', 'sales', 'support');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'on-leave', 'pending');
CREATE TYPE connection_status AS ENUM ('pending', 'approved', 'rejected', 'in-progress', 'completed', 'on-hold', 'inactive', 'suspended');
CREATE TYPE invoice_status AS ENUM ('unpaid', 'partial', 'paid', 'overdue');
CREATE TYPE complaint_status AS ENUM ('pending', 'in-progress', 'resolved', 'rejected');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE transaction_type AS ENUM ('in', 'out');
CREATE TYPE notification_type AS ENUM ('bill', 'payment', 'connection', 'complaint', 'announcement', 'system', 'info', 'warning', 'error', 'success', 'reminder');

-- Users table (replaces Firestore 'users' collection)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid VARCHAR(255) UNIQUE NOT NULL, -- Preserve Firebase UID
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    phone VARCHAR(50),
    address TEXT,
    assigned_area VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(is_active);
CREATE INDEX idx_users_assigned_area ON users(assigned_area);

-- Staff table (replaces Firestore 'staff' collection)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid VARCHAR(255) UNIQUE NOT NULL, -- Preserve Firebase UID
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    role user_role NOT NULL DEFAULT 'staff',
    status account_status NOT NULL DEFAULT 'active',
    assigned_area VARCHAR(255),
    permissions JSONB DEFAULT '{"view": true, "add": false, "edit": false, "delete": false, "approve": false}',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    salary DECIMAL(10, 2) DEFAULT 0.00,
    hire_date BIGINT,
    address TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for staff
CREATE INDEX idx_staff_username ON staff(username);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_assigned_area ON staff(assigned_area);

-- Refresh tokens table (replaces Firestore 'refreshTokens' collection)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Areas table (replaces Firestore 'areas' collection)
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    status account_status NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for areas
CREATE INDEX idx_areas_name ON areas(name);
CREATE INDEX idx_areas_status ON areas(status);

-- Packages table (replaces Firestore 'packages' collection)
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    speed VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status account_status NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for packages
CREATE INDEX idx_packages_name ON packages(name);
CREATE INDEX idx_packages_status ON packages(status);

-- Customers table (replaces Firestore 'customers' collection)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid VARCHAR(255) UNIQUE NOT NULL, -- Preserve Firebase UID
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE,
    cnic VARCHAR(50),
    email VARCHAR(255),
    mobile VARCHAR(50) NOT NULL,
    address TEXT,
    area VARCHAR(255) NOT NULL REFERENCES areas(name),
    status account_status NOT NULL DEFAULT 'active',
    package VARCHAR(255) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL,
    install_date BIGINT,
    iptv_enabled BOOLEAN DEFAULT false,
    live_ip_enabled BOOLEAN DEFAULT false,
    iptv_monthly_charges DECIMAL(10, 2) DEFAULT 0.00,
    live_ip_monthly_fee DECIMAL(10, 2) DEFAULT 0.00,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for customers
CREATE INDEX idx_customers_uid ON customers(uid);
CREATE INDEX idx_customers_username ON customers(username);
CREATE INDEX idx_customers_cnic ON customers(cnic);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_area ON customers(area);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_package ON customers(package);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Full-text search for customers
CREATE INDEX idx_customers_name_search ON customers USING gin(to_tsvector('english', name));
CREATE INDEX idx_customers_address_search ON customers USING gin(to_tsvector('english', COALESCE(address, '')));

-- Connections table (replaces Firestore 'connections' collection)
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL REFERENCES areas(name),
    status connection_status NOT NULL DEFAULT 'pending',
    assigned_staff UUID REFERENCES staff(id),
    technician_id UUID REFERENCES staff(id),
    installation_date BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for connections
CREATE INDEX idx_connections_customer_id ON connections(customer_id);
CREATE INDEX idx_connections_area ON connections(area);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_assigned_staff ON connections(assigned_staff);
CREATE INDEX idx_connections_created_at ON connections(created_at);

-- Invoices table (replaces Firestore 'invoices' collection)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    package VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    remaining_balance DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'unpaid',
    due_date BIGINT,
    last_payment_date BIGINT,
    last_payment_amount DECIMAL(10, 2),
    collected_by UUID REFERENCES staff(id),
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for invoices
CREATE INDEX idx_invoice_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoice_status ON invoices(status);
CREATE INDEX idx_invoice_package ON invoices(package);
CREATE INDEX idx_invoice_created_at ON invoices(created_at);
CREATE INDEX idx_invoice_collected_by ON invoices(collected_by);
CREATE INDEX idx_invoice_due_date ON invoices(due_date);

-- Full-text search for invoices
CREATE INDEX idx_invoice_customer_name_search ON invoices USING gin(to_tsvector('english', customer_name));

-- Payments table (replaces Firestore 'payments' collection)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status payment_status NOT NULL DEFAULT 'completed',
    approval_status approval_status NOT NULL DEFAULT 'approved',
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_reason TEXT,
    notes TEXT,
    collected_by UUID REFERENCES staff(id),
    received_by UUID REFERENCES staff(id),
    approved_by UUID REFERENCES staff(id),
    approved_at BIGINT,
    rejected_by UUID REFERENCES staff(id),
    rejected_at BIGINT,
    rejection_reason TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for payments
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_approval_status ON payments(approval_status);
CREATE INDEX idx_payments_collected_by ON payments(collected_by);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Expense categories table (replaces Firestore 'expenseCategories' collection)
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    budget DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    spent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#4C8DFF',
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for expense_categories
CREATE INDEX idx_expense_categories_name ON expense_categories(name);

-- Expenses table (replaces Firestore 'expenses' collection)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    title VARCHAR(255),
    category VARCHAR(255) NOT NULL REFERENCES expense_categories(name),
    amount DECIMAL(10, 2) NOT NULL,
    date BIGINT NOT NULL,
    description TEXT,
    area VARCHAR(255) REFERENCES areas(name),
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for expenses
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_area ON expenses(area);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);

-- Full-text search for expenses
CREATE INDEX idx_expenses_name_search ON expenses USING gin(to_tsvector('english', COALESCE(name, '')));
CREATE INDEX idx_expenses_description_search ON expenses USING gin(to_tsvector('english', COALESCE(description, '')));

-- Inventory table (replaces Firestore 'inventory' collection)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    min_stock_level INTEGER DEFAULT 10,
    monthly_usage DECIMAL(10, 2) DEFAULT 0.00,
    location VARCHAR(255),
    warehouse VARCHAR(255),
    status account_status NOT NULL DEFAULT 'active',
    last_restocked BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for inventory
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_qty ON inventory(qty);

-- Full-text search for inventory
CREATE INDEX idx_inventory_name_search ON inventory USING gin(to_tsvector('english', name));

-- Inventory transactions table (replaces Firestore 'inventoryTransactions' collection)
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory(id),
    item_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    type transaction_type NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    notes TEXT,
    performed_by VARCHAR(255),
    date BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for inventory_transactions
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(date);

-- Complaints table (replaces Firestore 'complaints' collection)
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority complaint_priority NOT NULL DEFAULT 'medium',
    status complaint_status NOT NULL DEFAULT 'pending',
    resolution TEXT,
    resolved_by UUID REFERENCES staff(id),
    resolved_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for complaints
CREATE INDEX idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);

-- Full-text search for complaints
CREATE INDEX idx_complaints_description_search ON complaints USING gin(to_tsvector('english', description));

-- Announcements table (replaces Firestore 'announcements' collection)
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    target VARCHAR(100) NOT NULL, -- 'all', 'admin', 'staff', 'customer'
    status account_status NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for announcements
CREATE INDEX idx_announcements_target ON announcements(target);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);

-- Full-text search for announcements
CREATE INDEX idx_announcements_title_search ON announcements USING gin(to_tsvector('english', title));
CREATE INDEX idx_announcements_message_search ON announcements USING gin(to_tsvector('english', message));

-- Notifications table (replaces Firestore 'notifications' collection)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    related_id UUID,
    related_type VARCHAR(100),
    expires_at BIGINT,
    created_at BIGINT NOT NULL
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- Logs table (replaces Firestore 'logs' collection)
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp BIGINT NOT NULL
);

-- Indexes for logs
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);

-- Views for common queries

-- Customer summary view
CREATE VIEW customer_summary AS
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
CREATE VIEW area_summary AS
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
CREATE VIEW staff_performance AS
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

-- Functions for common operations

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

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data (except admins)
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (
        id = (SELECT id FROM users WHERE email = current_setting('app.current_email', true))
        OR EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND email = current_setting('app.current_email', true))
    );

-- Policy: Customers can only see their own data
CREATE POLICY customers_select_own ON customers
    FOR SELECT
    USING (
        uid = current_setting('app.current_uid', true)
        OR EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND email = current_setting('app.current_email', true))
    );

-- Policy: Customers can only see their own invoices
CREATE POLICY invoices_select_own ON invoices
    FOR SELECT
    USING (
        customer_id = (SELECT id FROM customers WHERE uid = current_setting('app.current_uid', true))
        OR EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND email = current_setting('app.current_email', true))
        OR EXISTS (SELECT 1 FROM users WHERE role = 'staff' AND email = current_setting('app.current_email', true))
    );

-- Policy: Customers can only see their own complaints
CREATE POLICY complaints_select_own ON complaints
    FOR SELECT
    USING (
        customer_id = (SELECT id FROM customers WHERE uid = current_setting('app.current_uid', true))
        OR EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND email = current_setting('app.current_email', true))
        OR EXISTS (SELECT 1 FROM users WHERE role = 'staff' AND email = current_setting('app.current_email', true))
    );

-- Policy: Users can only see their own notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE email = current_setting('app.current_email', true)));


-- Create connection_expenses table
CREATE TABLE IF NOT EXISTS connection_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  vendor VARCHAR(255),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_connection_expenses_connection_id ON connection_expenses(connection_id);
CREATE INDEX idx_connection_expenses_date ON connection_expenses(date);

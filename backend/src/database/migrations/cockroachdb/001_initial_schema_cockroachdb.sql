-- Migration 001: Initial Schema (CockroachDB Compatible)
-- This migration creates the complete database schema for TrigonLinks ERP
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0
-- This should be idempotent - can be run multiple times without errors

-- Note: CockroachDB uses gen_random_uuid() instead of uuid-ossp extension
-- Note: ENUM types converted to VARCHAR with CHECK constraints for better compatibility
-- Note: GIN indexes converted to inverted indexes for full-text search
-- Note: SECURITY DEFINER removed (CockroachDB uses role-based security)
-- Note: current_setting() will be replaced with session variables in application layer

-- Create ENUM types as VARCHAR with CHECK constraints (CockroachDB compatible)
-- User Role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        -- Table doesn't exist yet, will be created with check constraint
    END IF;
END $$;

-- Account Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'status') THEN
        -- Table doesn't exist yet, will be created with check constraint
    END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_assigned_area ON users(assigned_area);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'customer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on-leave', 'pending')),
    assigned_area VARCHAR(255),
    permissions JSONB DEFAULT '{"view": true, "add": false, "edit": false, "delete": false, "approve": false}',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for staff
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_assigned_area ON staff(assigned_area);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL
);

-- Indexes for refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Areas table
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on-leave', 'pending')),
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for areas
CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);
CREATE INDEX IF NOT EXISTS idx_areas_status ON areas(status);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    speed VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on-leave', 'pending')),
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for packages
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE,
    cnic VARCHAR(50),
    email VARCHAR(255),
    mobile VARCHAR(50) NOT NULL,
    address TEXT,
    area VARCHAR(255) NOT NULL REFERENCES areas(name),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on-leave', 'pending')),
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
CREATE INDEX IF NOT EXISTS idx_customers_uid ON customers(uid);
CREATE INDEX IF NOT EXISTS idx_customers_username ON customers(username);
CREATE INDEX IF NOT EXISTS idx_customers_cnic ON customers(cnic);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_package ON customers(package);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Full-text search for customers (CockroachDB - using regular indexes for now)
-- Note: CockroachDB inverted indexes are for JSONB/arrays, not text search
-- For text search, we'll use regular indexes with LOWER function
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers (lower(name));
CREATE INDEX IF NOT EXISTS idx_customers_address_search ON customers (lower(COALESCE(address, '')));

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL REFERENCES areas(name),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in-progress', 'completed', 'on-hold', 'inactive', 'suspended')),
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
CREATE INDEX IF NOT EXISTS idx_connections_customer_id ON connections(customer_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_area ON connections(area);
CREATE INDEX IF NOT EXISTS idx_connections_assigned_staff ON connections(assigned_staff);

-- Connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL REFERENCES areas(name),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in-progress', 'completed', 'on-hold', 'inactive', 'suspended')),
    contact_phone VARCHAR(50) NOT NULL,
    contact_address TEXT,
    installation_date BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for connection_requests
CREATE INDEX IF NOT EXISTS idx_connection_requests_customer_id ON connection_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_area ON connection_requests(area);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    month VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    remaining_balance DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue')),
    due_date BIGINT,
    invoice_number VARCHAR(255) UNIQUE,
    generated_at BIGINT,
    paid_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(month);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date BIGINT,
    collected_by UUID REFERENCES staff(id),
    notes TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_collected_by ON payments(collected_by);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- New customer collections table
CREATE TABLE IF NOT EXISTS new_customer_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Installation Fee', 'Advance Payment', 'Security Deposit', 'Other')),
    amount DECIMAL(10, 2) NOT NULL,
    date BIGINT,
    description TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for new_customer_collections
CREATE INDEX IF NOT EXISTS idx_new_customer_collections_customer_id ON new_customer_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_new_customer_collections_type ON new_customer_collections(type);
CREATE INDEX IF NOT EXISTS idx_new_customer_collections_date ON new_customer_collections(date);

-- New customer expenses table
CREATE TABLE IF NOT EXISTS new_customer_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date BIGINT,
    description TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for new_customer_expenses
CREATE INDEX IF NOT EXISTS idx_new_customer_expenses_customer_id ON new_customer_expenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_new_customer_expenses_category ON new_customer_expenses(category);
CREATE INDEX IF NOT EXISTS idx_new_customer_expenses_date ON new_customer_expenses(date);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    date BIGINT,
    description TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    date BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for inventory_transactions
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(date);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date BIGINT,
    description TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    budget DECIMAL(10, 2),
    spent DECIMAL(10, 2) DEFAULT 0.00,
    created_at BIGINT NOT NULL,
    updated_at BIGINT
);

-- Indexes for expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    issue VARCHAR(255) NOT NULL,
    technician VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved', 'rejected')),
    priority VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    date BIGINT,
    resolution TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for complaints
CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_date ON complaints(date);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target VARCHAR(50) NOT NULL CHECK (target IN ('all', 'staff', 'customer')),
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('bill', 'payment', 'connection', 'complaint', 'announcement', 'system', 'info', 'warning', 'error', 'success', 'reminder')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at BIGINT,
    created_at BIGINT NOT NULL
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    timestamp BIGINT NOT NULL,
    ip_address VARCHAR(45)
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);

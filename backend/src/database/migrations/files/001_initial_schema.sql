-- Migration 001: Initial Schema
-- This migration creates the complete database schema for TrigonLinks ERP
-- Version: 1.0.0
-- This should be idempotent - can be run multiple times without errors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (IF NOT EXISTS via DO block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'on-leave', 'pending');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
        CREATE TYPE connection_status AS ENUM ('pending', 'approved', 'rejected', 'in-progress', 'completed', 'on-hold', 'inactive', 'suspended');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('unpaid', 'partial', 'paid', 'overdue');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status') THEN
        CREATE TYPE complaint_status AS ENUM ('pending', 'in-progress', 'resolved', 'rejected');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_priority') THEN
        CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('in', 'out');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('bill', 'payment', 'connection', 'complaint', 'announcement', 'system', 'info', 'warning', 'error', 'success', 'reminder');
    END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid VARCHAR(255) UNIQUE NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_assigned_area ON users(assigned_area);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid VARCHAR(255) UNIQUE NOT NULL,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);
CREATE INDEX IF NOT EXISTS idx_areas_status ON areas(status);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
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
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid VARCHAR(255) UNIQUE NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_customers_uid ON customers(uid);
CREATE INDEX IF NOT EXISTS idx_customers_username ON customers(username);
CREATE INDEX IF NOT EXISTS idx_customers_cnic ON customers(cnic);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_package ON customers(package);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Full-text search for customers
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_customers_address_search ON customers USING gin(to_tsvector('english', COALESCE(address, '')));

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
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
CREATE INDEX IF NOT EXISTS idx_connections_customer_id ON connections(customer_id);
CREATE INDEX IF NOT EXISTS idx_connections_area ON connections(area);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_assigned_staff ON connections(assigned_staff);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON connections(created_at);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
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
CREATE INDEX IF NOT EXISTS idx_invoice_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_package ON invoices(package);
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_collected_by ON invoices(collected_by);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON invoices(due_date);

-- Full-text search for invoices
CREATE INDEX IF NOT EXISTS idx_invoice_customer_name_search ON invoices USING gin(to_tsvector('english', customer_name));

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
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
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_approval_status ON payments(approval_status);
CREATE INDEX IF NOT EXISTS idx_payments_collected_by ON payments(collected_by);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
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
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
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
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_area ON expenses(area);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Full-text search for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_name_search ON expenses USING gin(to_tsvector('english', COALESCE(name, '')));
CREATE INDEX IF NOT EXISTS idx_expenses_description_search ON expenses USING gin(to_tsvector('english', COALESCE(description, '')));

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
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
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_qty ON inventory(qty);

-- Full-text search for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_name_search ON inventory USING gin(to_tsvector('english', name));

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
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
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(date);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
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
CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- Full-text search for complaints
CREATE INDEX IF NOT EXISTS idx_complaints_description_search ON complaints USING gin(to_tsvector('english', description));

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    target VARCHAR(100) NOT NULL,
    status account_status NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL,
    updated_at BIGINT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- Full-text search for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_title_search ON announcements USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_announcements_message_search ON announcements USING gin(to_tsvector('english', message));

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications_expires_at);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp BIGINT NOT NULL
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);

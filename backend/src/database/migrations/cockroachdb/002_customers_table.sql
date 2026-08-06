-- Migration 002: Customers Table (CockroachDB Compatible)

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

CREATE INDEX IF NOT EXISTS idx_customers_uid ON customers(uid);
CREATE INDEX IF NOT EXISTS idx_customers_username ON customers(username);
CREATE INDEX IF NOT EXISTS idx_customers_cnic ON customers(cnic);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_package ON customers(package);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Full-text search for customers (CockroachDB - using regular indexes)
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers (lower(name));
CREATE INDEX IF NOT EXISTS idx_customers_address_search ON customers (lower(COALESCE(address, '')));
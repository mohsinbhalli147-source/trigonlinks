-- Migration 007: Additional Customer Fields (CockroachDB Compatible)
-- From migration 004 and 013

-- Add missing customer fields
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_date BIGINT,
ADD COLUMN IF NOT EXISTS install_fee DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS install_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_balance DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS iptv_box_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS iptv_box_price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS iptv_installation_charges DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS live_ip_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS live_ip_installation_fee DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS last_activity_at BIGINT;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_customers_father_name ON customers(father_name);
CREATE INDEX IF NOT EXISTS idx_customers_emergency_contact ON customers(emergency_contact);
CREATE INDEX IF NOT EXISTS idx_customers_billing_date ON customers(billing_date);
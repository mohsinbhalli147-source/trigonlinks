-- Migration 007 Part 2: Additional Customer Fields (CockroachDB Compatible)

ALTER TABLE customers ADD COLUMN IF NOT EXISTS iptv_box_number VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS iptv_box_price DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS iptv_installation_charges DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS live_ip_address VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS live_ip_installation_fee DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_activity_at BIGINT;

CREATE INDEX IF NOT EXISTS idx_customers_father_name ON customers(father_name);
CREATE INDEX IF NOT EXISTS idx_customers_emergency_contact ON customers(emergency_contact);
CREATE INDEX IF NOT EXISTS idx_customers_billing_date ON customers(billing_date);
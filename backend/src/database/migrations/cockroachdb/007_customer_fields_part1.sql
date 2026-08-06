-- Migration 007 Part 1: Additional Customer Fields (CockroachDB Compatible)
-- Breaking down ALTER TABLE into individual statements

ALTER TABLE customers ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_date BIGINT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS install_fee DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS install_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS previous_balance DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
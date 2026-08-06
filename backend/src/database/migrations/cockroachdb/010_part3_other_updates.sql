-- Migration 010 Part 3: Other Table Updates (CockroachDB Compatible)

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'monthly_bill' CHECK (type IN ('monthly_bill', 'connection_fee', 'other'));

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_type VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_id UUID;
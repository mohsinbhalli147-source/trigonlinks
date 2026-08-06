-- Migration 010: Inventory Updates (CockroachDB Compatible)
-- From migration 008

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50) DEFAULT 'piece';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_purchase_cost DECIMAL(12, 2) DEFAULT 0.00;

ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS previous_stock INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS new_stock INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'monthly_bill' CHECK (type IN ('monthly_bill', 'connection_fee', 'other'));

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_type VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_id UUID;
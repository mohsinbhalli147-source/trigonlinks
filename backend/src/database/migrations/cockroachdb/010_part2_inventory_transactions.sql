-- Migration 010 Part 2: Inventory Transactions Updates (CockroachDB Compatible)

ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS previous_stock INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS new_stock INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) DEFAULT 0.00;
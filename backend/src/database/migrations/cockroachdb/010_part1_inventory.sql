-- Migration 010 Part 1: Inventory Table Updates (CockroachDB Compatible)

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50) DEFAULT 'piece';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_purchase_cost DECIMAL(12, 2) DEFAULT 0.00;
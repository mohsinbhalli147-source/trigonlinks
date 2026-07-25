-- Migration 008: Complete ISP ERP Phase 1 Updates

-- 1. Inventory table upgrades (Brand, Unit Type, Supplier, Cost/Selling details)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50) DEFAULT 'piece';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_purchase_cost DECIMAL(12, 2) DEFAULT 0.00;

-- 2. Inventory Transactions table upgrades
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS previous_stock INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS new_stock INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) DEFAULT 0.00;

-- 3. Invoice Type Enum & Column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
        CREATE TYPE invoice_type AS ENUM ('monthly_bill', 'connection_fee', 'other');
    END IF;
END $$;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type invoice_type NOT NULL DEFAULT 'monthly_bill';

-- 4. Expenses Table Upgrades for Reference Linking
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_type VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reference_id UUID;

-- 5. Connection Used Items Table
CREATE TABLE IF NOT EXISTS connection_used_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    item_id UUID NOT NULL REFERENCES inventory(id),
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_conn_used_items_conn_id ON connection_used_items(connection_id);
CREATE INDEX IF NOT EXISTS idx_conn_used_items_cust_id ON connection_used_items(customer_id);

-- 6. Audit Logs enhancement check
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);

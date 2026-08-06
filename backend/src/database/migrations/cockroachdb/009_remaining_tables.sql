-- Migration 009: Remaining Tables (CockroachDB Compatible)
-- New customer collections and expenses

-- New customer collections table
CREATE TABLE IF NOT EXISTS new_customer_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Installation Fee', 'Advance Payment', 'Security Deposit', 'Other')),
    amount DECIMAL(10, 2) NOT NULL,
    date BIGINT,
    description TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_new_customer_collections_customer_id ON new_customer_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_new_customer_collections_type ON new_customer_collections(type);
CREATE INDEX IF NOT EXISTS idx_new_customer_collections_date ON new_customer_collections(date);

-- New customer expenses table
CREATE TABLE IF NOT EXISTS new_customer_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date BIGINT,
    description TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_new_customer_expenses_customer_id ON new_customer_expenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_new_customer_expenses_category ON new_customer_expenses(category);
CREATE INDEX IF NOT EXISTS idx_new_customer_expenses_date ON new_customer_expenses(date);

-- Connection expenses table
CREATE TABLE IF NOT EXISTS connection_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    expense_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_connection_expenses_connection_id ON connection_expenses(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_expenses_customer_id ON connection_expenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_connection_expenses_type ON connection_expenses(expense_type);

-- Connection used items table
CREATE TABLE IF NOT EXISTS connection_used_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    item_id UUID NOT NULL,
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
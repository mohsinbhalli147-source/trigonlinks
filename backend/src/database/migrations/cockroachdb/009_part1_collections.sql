-- Migration 009 Part 1: New Customer Collections (CockroachDB Compatible)

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
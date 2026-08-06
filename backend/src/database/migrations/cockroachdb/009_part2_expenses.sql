-- Migration 009 Part 2: New Customer Expenses (CockroachDB Compatible)

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
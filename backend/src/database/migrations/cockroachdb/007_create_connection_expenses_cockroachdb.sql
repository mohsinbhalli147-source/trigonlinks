-- Migration 007: Create Connection Expenses Table (CockroachDB Compatible)
-- This migration creates the connection_expenses table
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- Create connection_expenses table
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

-- Indexes for connection_expenses
CREATE INDEX IF NOT EXISTS idx_connection_expenses_connection_id ON connection_expenses(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_expenses_customer_id ON connection_expenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_connection_expenses_type ON connection_expenses(expense_type);

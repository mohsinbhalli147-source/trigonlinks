-- Migration 006: Make Customer ID Nullable (CockroachDB Compatible)
-- This migration makes customer_id nullable in certain tables
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- Make customer_id nullable in connection_requests
ALTER TABLE connection_requests ALTER COLUMN customer_id DROP NOT NULL;

-- Make customer_id nullable in new_customer_collections
ALTER TABLE new_customer_collections ALTER COLUMN customer_id DROP NOT NULL;

-- Make customer_id nullable in new_customer_expenses
ALTER TABLE new_customer_expenses ALTER COLUMN customer_id DROP NOT NULL;

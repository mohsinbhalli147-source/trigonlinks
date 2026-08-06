-- Migration 012: Make Customer ID Nullable (CockroachDB Compatible)
-- From migration 006

ALTER TABLE connection_requests ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE new_customer_collections ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE new_customer_expenses ALTER COLUMN customer_id DROP NOT NULL;
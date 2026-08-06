-- Migration 011 Part 1: Connection Request Fields (CockroachDB Compatible)

ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_uid VARCHAR(255);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_cnic VARCHAR(50);
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
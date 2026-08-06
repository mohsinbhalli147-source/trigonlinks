-- Migration 005: Add Connection Request Fields (CockroachDB Compatible)
-- This migration adds additional fields to connection_requests table
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- Add additional fields to connection_requests
ALTER TABLE connection_requests
ADD COLUMN IF NOT EXISTS customer_uid VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_cnic VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS preferred_date BIGINT,
ADD COLUMN IF NOT EXISTS preferred_time_slot VARCHAR(50),
ADD COLUMN IF NOT EXISTS equipment_needed JSONB;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_connection_requests_customer_uid ON connection_requests(customer_uid);
CREATE INDEX IF NOT EXISTS idx_connection_requests_preferred_date ON connection_requests(preferred_date);

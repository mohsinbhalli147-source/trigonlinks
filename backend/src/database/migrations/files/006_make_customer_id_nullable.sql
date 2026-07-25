-- Make customer_id nullable to support connection requests without existing customers
-- Migration: 006_make_customer_id_nullable.sql
-- Description: Allow connection requests to be created without a customer_id (customer created on approval)

ALTER TABLE connections 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add comment to clarify the workflow
COMMENT ON COLUMN connections.customer_id IS 'Customer ID (null for pending requests, set when approved)';

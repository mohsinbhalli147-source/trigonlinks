-- Add missing fields for connection requests
-- Migration: 005_add_connection_request_fields.sql
-- Description: Add customer details and financial fields to connections table for full connection request support

-- Add customer identification fields
ALTER TABLE connections 
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS cnic TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add financial details
ALTER TABLE connections 
ADD COLUMN IF NOT EXISTS billing_date TEXT,
ADD COLUMN IF NOT EXISTS connection_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS concession NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS concession_reason TEXT;

-- Add expenses field (JSONB for array of expense objects)
ALTER TABLE connections 
ADD COLUMN IF NOT EXISTS expenses JSONB DEFAULT '[]'::jsonb;

-- Add rejection reason field
ALTER TABLE connections 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_connections_phone ON connections(phone);

-- Create index on cnic for faster lookups
CREATE INDEX IF NOT EXISTS idx_connections_cnic ON connections(cnic);

-- Add comments for documentation
COMMENT ON COLUMN connections.father_name IS 'Father name of the customer';
COMMENT ON COLUMN connections.phone IS 'Contact phone number';
COMMENT ON COLUMN connections.cnic IS 'CNIC number of the customer';
COMMENT ON COLUMN connections.address IS 'Residential address';
COMMENT ON COLUMN connections.billing_date IS 'Billing cycle day (1-28)';
COMMENT ON COLUMN connections.connection_fee IS 'One-time connection installation fee';
COMMENT ON COLUMN connections.monthly_fee IS 'Recurring monthly subscription fee';
COMMENT ON COLUMN connections.concession IS 'Discount percentage (0-100)';
COMMENT ON COLUMN connections.concession_reason IS 'Reason for concession/discount';
COMMENT ON COLUMN connections.expenses IS 'Array of installation expenses';
COMMENT ON COLUMN connections.rejection_reason IS 'Reason for connection rejection';

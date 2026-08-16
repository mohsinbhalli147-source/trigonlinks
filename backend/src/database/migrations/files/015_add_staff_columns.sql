-- Migration 015: Add address and additional columns to staff table
-- The staff creation form sends address/cnic/position fields that did not exist
-- as columns in the staff table, causing 500 errors on create.

ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS position TEXT;

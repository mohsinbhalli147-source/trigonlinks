-- Migration: Update staff table with new fields and role enum
-- This migration adds missing fields to the staff table and updates the role enum

-- Step 1: Add new columns to staff table if they don't exist
DO $$
BEGIN
    -- Add salary column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'salary'
    ) THEN
        ALTER TABLE staff ADD COLUMN salary DECIMAL(10, 2) DEFAULT 0.00;
    END IF;

    -- Add hire_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'hire_date'
    ) THEN
        ALTER TABLE staff ADD COLUMN hire_date BIGINT;
    END IF;

    -- Add address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'address'
    ) THEN
        ALTER TABLE staff ADD COLUMN address TEXT;
    END IF;
END $$;

-- Step 2: Update user_role enum to include new roles
-- Note: PostgreSQL doesn't support adding values to enum directly
-- We need to create a new type and migrate

-- Create new enum type with all roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_new') THEN
        CREATE TYPE user_role_new AS ENUM ('admin', 'staff', 'customer', 'manager', 'technician', 'collector', 'sales', 'support');
    END IF;
END $$;

-- Migrate existing data to new enum
ALTER TABLE staff ALTER COLUMN role TYPE user_role_new USING 
    CASE 
        WHEN role = 'admin' THEN 'admin'::user_role_new
        WHEN role = 'staff' THEN 'staff'::user_role_new
        WHEN role = 'customer' THEN 'customer'::user_role_new
        ELSE 'staff'::user_role_new -- Default to staff for any unknown values
    END;

-- Migrate users table role column as well
ALTER TABLE users ALTER COLUMN role TYPE user_role_new USING 
    CASE 
        WHEN role = 'admin' THEN 'admin'::user_role_new
        WHEN role = 'staff' THEN 'staff'::user_role_new
        WHEN role = 'customer' THEN 'customer'::user_role_new
        ELSE 'staff'::user_role_new -- Default to staff for any unknown values
    END;

-- Drop old enum type
DROP TYPE user_role;

-- Rename new enum to original name
ALTER TYPE user_role_new RENAME TO user_role;

-- Step 3: Add indexes for new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_staff_salary ON staff(salary);
CREATE INDEX IF NOT EXISTS idx_staff_hire_date ON staff(hire_date);

-- Step 4: Update existing staff records with default hire_date if null
UPDATE staff SET hire_date = created_at WHERE hire_date IS NULL;

-- Migration complete

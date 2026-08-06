-- Migration 012: Fix connection_expenses RLS Policies
-- This migration optimizes RLS policies for connection_expenses table
-- to remove Auth RLS Initialization Plan warnings
-- Version: 1.0.0

-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access to connection_expenses" ON connection_expenses;
DROP POLICY IF EXISTS "Staff have select access to connection_expenses" ON connection_expenses;
DROP POLICY IF EXISTS "Staff have insert access to connection_expenses" ON connection_expenses;
DROP POLICY IF EXISTS "Staff have update access to connection_expenses" ON connection_expenses;

-- Create helper function to check if current user is admin (cached)
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE role = 'admin' 
        AND email = current_setting('app.current_email', true)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create helper function to check if current user is staff (cached)
CREATE OR REPLACE FUNCTION is_current_user_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE role = 'staff' 
        AND email = current_setting('app.current_email', true)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized Policy: Admins have full access to connection_expenses
CREATE POLICY "Admins have full access to connection_expenses" 
ON connection_expenses FOR ALL 
USING (is_current_user_admin());

-- Optimized Policy: Staff have select access to connection_expenses
CREATE POLICY "Staff have select access to connection_expenses" 
ON connection_expenses FOR SELECT 
USING (is_current_user_staff());

-- Optimized Policy: Staff have insert access to connection_expenses
CREATE POLICY "Staff have insert access to connection_expenses" 
ON connection_expenses FOR INSERT 
WITH CHECK (is_current_user_staff());

-- Optimized Policy: Staff have update access to connection_expenses
CREATE POLICY "Staff have update access to connection_expenses" 
ON connection_expenses FOR UPDATE 
USING (is_current_user_staff());

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_staff() TO authenticated;

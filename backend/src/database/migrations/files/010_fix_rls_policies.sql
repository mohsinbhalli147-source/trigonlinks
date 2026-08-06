-- Migration 010: Fix RLS Policies for Supabase Security Best Practices
-- This migration optimizes RLS policies to remove Auth RLS Initialization Plan warnings
-- by replacing subqueries with direct function calls and using auth.uid() where appropriate
-- Version: 1.0.0

-- Drop existing policies
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS customers_select_own ON customers;
DROP POLICY IF EXISTS invoices_select_own ON invoices;
DROP POLICY IF EXISTS complaints_select_own ON complaints;
DROP POLICY IF EXISTS notifications_select_own ON notifications;

-- Create helper function to get current user role (cached)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE email = current_setting('app.current_email', true)
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create helper function to get current user ID (cached)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM users 
        WHERE email = current_setting('app.current_email', true)
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create helper function to get current customer ID (cached)
CREATE OR REPLACE FUNCTION get_current_customer_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM customers 
        WHERE uid = current_setting('app.current_uid', true)
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized Policy: Users can only see their own data (except admins)
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (
        id = get_current_user_id()
        OR get_current_user_role() = 'admin'
    );

-- Optimized Policy: Customers can only see their own data
CREATE POLICY customers_select_own ON customers
    FOR SELECT
    USING (
        uid = current_setting('app.current_uid', true)
        OR get_current_user_role() = 'admin'
    );

-- Optimized Policy: Customers can only see their own invoices
CREATE POLICY invoices_select_own ON invoices
    FOR SELECT
    USING (
        customer_id = get_current_customer_id()
        OR get_current_user_role() = 'admin'
        OR get_current_user_role() = 'staff'
    );

-- Optimized Policy: Customers can only see their own complaints
CREATE POLICY complaints_select_own ON complaints
    FOR SELECT
    USING (
        customer_id = get_current_customer_id()
        OR get_current_user_role() = 'admin'
        OR get_current_user_role() = 'staff'
    );

-- Optimized Policy: Users can only see their own notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    USING (user_id = get_current_user_id());

-- Migration 011: Fix Views Security Definer (CockroachDB Compatible)
-- This migration updates views to work without SECURITY DEFINER
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- Note: SECURITY DEFINER already removed in migration 002
-- Views will work with application-level security
-- No changes needed here
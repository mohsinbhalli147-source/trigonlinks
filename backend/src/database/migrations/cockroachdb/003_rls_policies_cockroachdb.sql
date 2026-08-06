-- Migration 003: Row Level Security (RLS) Policies (CockroachDB Compatible)
-- This migration enables RLS and creates security policies
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- Note: CockroachDB has different RLS implementation
-- For now, we will skip RLS and implement security at application layer
-- RLS can be added later using CockroachDB's zone-based security or similar mechanisms

-- Skip RLS for now - will be implemented at application layer
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Note: Security policies will be implemented in application middleware
-- instead of database-level RLS for better compatibility with CockroachDB

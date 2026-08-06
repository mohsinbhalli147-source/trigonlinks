-- Migration 009: Add Read At Column (CockroachDB Compatible)
-- This migration adds read_at column to notifications table
-- Converted from PostgreSQL to CockroachDB
-- Version: 1.0.0

-- Add read_at column to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at BIGINT;

-- Add index for read_at
CREATE INDEX IF NOT EXISTS idx_notifications_read_at_new ON notifications(read_at);

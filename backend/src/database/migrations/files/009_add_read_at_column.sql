-- Migration 009: Add read_at column to notifications table
-- This migration adds the read_at column to track when notifications were marked as read

-- Add read_at column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at BIGINT;

-- Create index for read_at to optimize queries
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

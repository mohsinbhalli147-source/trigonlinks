-- Migration 014: Create password_reset_otps table
-- Stores hashed OTPs for password reset with expiry and attempt tracking.
-- OTPs are stored as SHA-256 hashes (never plaintext) and auto-expire after 10 minutes.
-- A max-attempts counter prevents brute-force attacks.

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by email (most recent unconsumed)
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email
  ON password_reset_otps (email)
  WHERE consumed = FALSE;

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at
  ON password_reset_otps (expires_at);

-- Enable RLS
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Only the service role (backend) can access this table.
-- No anon/authenticated access — OTP verification happens server-side only.
CREATE POLICY "service_role_all_access_password_reset_otps"
  ON password_reset_otps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup: delete expired entries older than 1 hour
-- (runs via pg_cron if available, otherwise handled by application)

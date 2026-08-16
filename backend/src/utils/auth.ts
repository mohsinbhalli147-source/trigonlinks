import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from './logger';
import { getAdminClient } from '../database/client';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validate JWT secrets are set
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export interface TokenPayload {
  uid: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Generate access token
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Generate refresh token
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

// Generate both tokens
export const generateAuthTokens = (payload: TokenPayload): AuthTokens => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate random token for password reset
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Store OTP in the database (hashed, with expiry and attempt tracking).
// OTPs are never stored in plaintext — a SHA-256 hash is used since the OTP
// is a short-lived 6-digit code.
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

export const storeOTP = async (email: string, otp: string): Promise<void> => {
  const supabase = getAdminClient();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // Remove any previous unconsumed OTPs for this email before inserting a new one
  await supabase
    .from("password_reset_otps")
    .delete()
    .eq("email", email)
    .eq("consumed", false);

  const { error } = await supabase
    .from("password_reset_otps")
    .insert({ email, otp_hash: otpHash, expires_at: expiresAt, max_attempts: OTP_MAX_ATTEMPTS });

  if (error) {
    logger.error("[OTP] Failed to store OTP:", error);
    throw error;
  }
};

export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  const supabase = getAdminClient();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  // Fetch the latest unconsumed OTP for this email
  const { data, error } = await supabase
    .from("password_reset_otps")
    .select("id, otp_hash, expires_at, attempts, max_attempts")
    .eq("email", email)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    logger.warn("[OTP] No valid OTP found for email");
    return false;
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("password_reset_otps").delete().eq("id", data.id);
    logger.warn("[OTP] OTP expired for email");
    return false;
  }

  // Check attempt limit
  if (data.attempts >= data.max_attempts) {
    await supabase.from("password_reset_otps").delete().eq("id", data.id);
    logger.warn(`[OTP] Max attempts (${data.max_attempts}) exceeded for email`);
    return false;
  }

  // Verify hash
  if (data.otp_hash !== otpHash) {
    await supabase
      .from("password_reset_otps")
      .update({ attempts: data.attempts + 1 })
      .eq("id", data.id);
    logger.warn("[OTP] Invalid OTP provided");
    return false;
  }

  // Success — delete the consumed OTP
  await supabase.from("password_reset_otps").delete().eq("id", data.id);
  return true;
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

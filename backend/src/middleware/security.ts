import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logger } from '../utils/logger';

// General rate limiter for all requests
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication endpoints.
// 20 attempts per 15 minutes is sufficient for legitimate users while
// making brute-force and credential-stuffing attacks impractical.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 API requests per windowMs
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down requests that are approaching the limit
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 200, // Allow 200 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  validate: { delayMs: false }, // Disable warning
});

// Input sanitization middleware
export const sanitizeInput = (req: any, res: any, next: any) => {
  // Sanitize request body (only trim string values that are not IDs or numeric fields)
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Don't trim UUIDs, IDs, or fields that might be numeric strings
        if (!key.includes('_id') && 
            !key.includes('amount') &&
            !key.includes('fee') &&
            !key.includes('date') &&
            !key.includes('uid') &&
            req.body[key].length > 0) {
          req.body[key] = req.body[key].trim();
        }
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }
  
  next();
};

// Security headers middleware (additional to helmet)
export const securityHeaders = (req: any, res: any, next: any) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Request logging middleware for security monitoring
export const securityLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Log request details using logger instead of console
  logger.info(`[Security] ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.user?.uid || 'anonymous'}`);
  
  // Log response using logger instead of console
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`[Security] ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  
  next();
};

// Safely format an error for an API response.
// In development the full error message is returned (useful for debugging).
// In production only a generic message is sent so internal details are not leaked.
export const formatErrorResponse = (error: unknown, fallbackMessage = "Internal server error"): string => {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : String(error);
  }
  return fallbackMessage;
};

/**
 * Map a Supabase/PostgreSQL error to a meaningful HTTP {status, message}.
 * Supabase-js surfaces PG errors as {code, message, details, hint}.
 * Returns null when the error isn't a recognized PG error so callers can
 * fall back to a generic 500.
 */
export const pgErrorToResponse = (
  error: unknown
): { status: number; message: string } | null => {
  const e = error as any;
  const code = e?.code || e?.pgError?.code;
  const message: string = e?.message || "";
  const details: string = e?.details || "";

  if (!code) return null;

  const keyMatch = details.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
  const fieldLabel = (col: string) =>
    col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  switch (code) {
    case "23505": {
      if (keyMatch) {
        const [, col, val] = keyMatch;
        return {
          status: 409,
          message: `${fieldLabel(col)} "${val}" is already taken. Please use a different ${fieldLabel(col).toLowerCase()}.`,
        };
      }
      return { status: 409, message: "A record with this value already exists." };
    }
    case "23502": {
      const colMatch = message.match(/column "([^"]+)"/);
      const col = colMatch ? colMatch[1] : "a required field";
      return { status: 400, message: `Missing value for required field: ${fieldLabel(col)}.` };
    }
    case "23514":
      return { status: 400, message: "Value violates a database check constraint (e.g., invalid status or negative amount)." };
    case "23503":
      return { status: 400, message: "Referenced record does not exist (foreign key violation)." };
    case "22P02":
    case "22P05":
      return { status: 400, message: "Invalid input format. Please check numeric/UUID fields." };
    default:
      return null;
  }
};

import express from 'express';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { 
  hashPassword, 
  comparePassword, 
  generateAuthTokens, 
  verifyRefreshToken,
  generateResetToken,
  generateOTP,
  storeOTP,
  verifyOTP
} from '../utils/auth';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { cache } from '../utils/cache';
import { sendPasswordResetEmail, isEmailConfigured } from '../utils/mail';
import { getSupabaseClient } from '../database/client';
import { UsersRepository } from '../repositories/UsersRepository';

const router = express.Router();
const supabase = getSupabaseClient();
const usersRepo = new UsersRepository();

// Register new user (admin only)
router.post('/register', authenticate, authorize('admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').notEmpty().trim(),
  body('role').isIn(['admin', 'staff', 'customer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, name, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await usersRepo.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate UUID for user
    const uid = crypto.randomUUID();

    // Create user in PostgreSQL via Supabase
    const { data: result, error: insertError } = await supabase
      .from('users')
      .insert({
        uid,
        email,
        password_hash: hashedPassword,
        name,
        role,
        phone,
        address,
        is_active: true,
        email_verified: false,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .select('id')
      .limit(1);

    if (insertError) throw insertError;

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result![0].id 
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await usersRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = generateAuthTokens({
      uid: user.uid,
      email: user.email,
      role: user.role,
    });

    await supabase
      .from('refresh_tokens')
      .insert({
        token: tokens.refreshToken,
        user_id: user.id,
        created_at: Date.now(),
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

    await supabase
      .from('users')
      .update({ last_login_at: Date.now() })
      .eq('id', user.id);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Customer Login (Username + CNIC)
router.post('/customer-login', [
  body('username').notEmpty(),
  body('cnic').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, cnic } = req.body;

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('username', username)
      .eq('cnic', cnic)
      .limit(1);

    if (customerError || !customerData || customerData.length === 0) {
      return res.status(401).json({ error: 'Invalid Username or CNIC' });
    }

    const customer = customerData[0];

    if (customer.status !== 'active' && customer.status !== 'suspended') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Generate tokens
    const tokens = generateAuthTokens({
      uid: customer.uid,
      email: customer.email || `${username}@customer.trigonlinks.com`,
      role: 'customer',
    });

    try {
      await supabase
        .from('refresh_tokens')
        .insert({
          token: tokens.refreshToken,
          user_id: customer.id,
          created_at: Date.now(),
          expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
        });
    } catch (e) {
      logger.warn('Failed to store refresh token');
    }

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        uid: customer.uid,
        email: customer.email || '',
        name: customer.name,
        role: 'customer',
        phone: customer.mobile,
      },
    });
  } catch (error: any) {
    logger.error('Customer Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    logger.info('Refresh token request received');

    if (!refreshToken) {
      logger.info('No refresh token provided');
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    logger.info('Refresh token verified for user:', payload.uid);

    // Check if refresh token exists in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .limit(1);

    if (tokenError) {
      logger.error('Token database error:', tokenError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!tokenData || tokenData.length === 0) {
      logger.info('Refresh token not found in database');
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const token = tokenData[0];

    // Check if token is expired
    if (token.expires_at < Date.now()) {
      logger.info('Refresh token expired, deleting');
      await supabase.from('refresh_tokens').delete().eq('id', token.id);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    logger.info('Refresh token valid, generating new tokens');

    // Get user data from either users or customers collection
    const user = await usersRepo.findByUid(payload.uid);
    let userData;
    if (!user) {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('uid', payload.uid)
        .limit(1);
      if (customerError || !customerData || customerData.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      userData = customerData[0];
    } else {
      userData = user;
    }

    // Generate new tokens
    const tokens = generateAuthTokens({
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
    });

    // Delete old refresh token and store new one
    await supabase.from('refresh_tokens').delete().eq('id', token.id);
    await supabase
      .from('refresh_tokens')
      .insert({
        token: tokens.refreshToken,
        user_id: userData.id,
        created_at: Date.now(),
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error: any) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from database
      await supabase.from('refresh_tokens').delete().eq('token', refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Request password reset (send OTP)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;

    // Find user by email
    const user = await usersRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, an OTP will be sent' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP
    storeOTP(email, otp);

    if (isEmailConfigured()) {
      try {
        await sendPasswordResetEmail(email, otp);
        return res.json({ 
          message: 'OTP sent to email',
          otp: process.env.NODE_ENV !== 'production' ? otp : undefined // Show OTP in dev mode
        });
      } catch (mailError: any) {
        logger.error('Password reset email send failure:', mailError);
        // Return OTP in development mode if email fails
        return res.json({ 
          message: 'Email service failed. Development mode OTP: ' + otp,
          otp: otp
        });
      }
    } else {
      logger.warn('Password reset requested but email service is not configured.');
      // Return OTP in development mode if email not configured
      return res.json({ 
        message: 'Email service not configured. Development mode OTP: ' + otp,
        otp: otp
      });
    }

    res.json({ 
      message: 'If the email exists, an OTP will be sent'
    });
  } catch (error: any) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password with OTP
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, otp, password } = req.body;

    logger.info('Reset password request:', { email, otp: otp ? '***' : 'missing', password: password ? '***' : 'missing' });

    // Verify OTP
    const otpValid = verifyOTP(email, otp);
    logger.info('OTP verification result:', otpValid);
    
    if (!otpValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Find user by email
    const user = await usersRepo.findByEmail(email);
    if (!user) {
      logger.info('User not found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('User found, updating password for user ID:', user.id);

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword, updated_at: Date.now() })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Password update error:', updateError);
      throw updateError;
    }

    // Delete all refresh tokens for this user
    await supabase.from('refresh_tokens').delete().eq('user_id', user.id);

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    logger.error('Reset password error:', error);
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
});

// Change password (authenticated)
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user data
    const user = await usersRepo.findByUid(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await supabase
      .from('users')
      .update({ password_hash: hashedPassword, updated_at: Date.now() })
      .eq('id', user.id);

    // Delete all refresh tokens for this user
    await supabase.from('refresh_tokens').delete().eq('user_id', user.id);

    // Invalidate cache
    cache.delete(`user:${userId}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;


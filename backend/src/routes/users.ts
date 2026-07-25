import express from 'express';
import { body, validationResult, query as queryValidator } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UsersRepository } from '../repositories/UsersRepository';
import { getSupabaseClient } from '../database/client';
import { hashPassword } from '../utils/auth';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

const router = express.Router();
const supabase = getSupabaseClient();
const usersRepo = new UsersRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      role = '',
      status = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (role) {
      whereClause += ` AND role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    if (status === 'active') {
      whereClause += ` AND is_active = true`;
    } else if (status === 'inactive') {
      whereClause += ` AND is_active = false`;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const [totalResult, dataResult] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${search}%`),
      supabase
        .from('users')
        .select('id, uid, email, name, role, phone, address, assigned_area, is_active, email_verified, created_at, updated_at')
        .ilike('name', `%${search}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1),
    ]);

    const total = totalResult.count || 0;

    res.json({
      users: dataResult.data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user profile (must come before /:id)
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    logger.info(`Fetching profile for user ID: ${userId}`);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await usersRepo.findByUid(userId);
    if (!user) {
      logger.error(`User not found for UID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive data
    const { password_hash, ...userResponse } = user as any;
    
    res.json(userResponse);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get single user (admin only)
router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await usersRepo.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive data
    const { password_hash, ...userResponse } = user as any;
    
    res.json(userResponse);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user (admin only)
router.post('/', authorize('admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').isIn(['admin', 'staff', 'customer']),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, name, role, phone, address, assignedArea } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user document with consistent uid field
    const uid = crypto.randomUUID();
    const userData = {
      uid,
      email,
      password_hash: hashedPassword,
      name,
      role,
      phone: phone || '',
      address: address || '',
      assigned_area: assignedArea || '',
      is_active: true,
      email_verified: false,
      created_at: Date.now(),
      updated_at: Date.now(),
      created_by: req.user?.uid,
    };

    const { data: result, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select('id, uid, email, name, role, phone, address, assigned_area, is_active, email_verified, created_at, updated_at')
      .limit(1);

    if (insertError) throw insertError;

    res.status(201).json(result![0]);
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/:id', authorize('admin'), [
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'staff', 'customer']),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, name, role, phone, address, assignedArea, isActive } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const { data: userResult } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (assignedArea !== undefined) updateData.assigned_area = assignedArea;
    if (isActive !== undefined) updateData.is_active = isActive;

    // If password is being updated
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updateData.password_hash = await hashPassword(req.body.password);
    }

    const { data: result, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, uid, email, name, role, phone, address, assigned_area, is_active, email_verified, created_at, updated_at')
      .limit(1);

    if (updateError) throw updateError;

    // Invalidate cache
    cache.delete(`user:${userId}`);

    res.json(result![0]);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const { data: userResult } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (userResult[0].role === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      
      if ((count || 0) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await supabase.from('users').delete().eq('id', userId);

    // Delete all refresh tokens for this user
    await supabase.from('refresh_tokens').delete().eq('user_id', userId);

    // Invalidate cache
    cache.delete(`user:${userId}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get current user profile (alternate endpoint)
router.get('/profile/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await usersRepo.findByUid(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { password_hash, ...userResponse } = user as any;

    res.json(userResponse);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user profile
router.put('/profile/me', authenticate, [
  body('email').optional().isEmail().normalizeEmail(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, phone, address } = req.body;

    const updateData: any = {
      updated_at: Date.now(),
    };

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const { data: result, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('uid', userId)
      .select('id, uid, email, name, role, phone, address, assigned_area, is_active, email_verified, created_at, updated_at')
      .limit(1);

    if (updateError) throw updateError;

    // Invalidate cache
    cache.delete(`user:${userId}`);

    res.json(result![0]);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;


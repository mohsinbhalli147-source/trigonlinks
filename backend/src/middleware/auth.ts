import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';
import { getSupabaseClient } from '../database/client';
import { cache } from '../utils/cache';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

const supabase = getSupabaseClient();

// Verify JWT access token
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const payload = verifyAccessToken(token);
      
      // Check cache first
      const cacheKey = `user:${payload.uid}`;
      let cachedUser = cache.get(cacheKey);
      
      if (!cachedUser) {
        // Get user data from PostgreSQL to ensure user still exists and is active
        let userResult = await supabase
          .from('users')
          .select('*')
          .eq('uid', payload.uid)
          .limit(1);
        
        let isCustomer = false;
        let userData;

        if (!userResult.data || userResult.data.length === 0 && payload.role === 'customer') {
          const customerResult = await supabase
            .from('customers')
            .select('*')
            .eq('uid', payload.uid)
            .limit(1);
          
          if (customerResult.data && customerResult.data.length > 0) {
            userData = customerResult.data[0];
            isCustomer = true;
          }
        } else if (userResult.data && userResult.data.length > 0) {
          userData = userResult.data[0];
        }
        
        if (!userData) {
          return res.status(401).json({ error: 'User not found' });
        }

        if (isCustomer) {
          if (userData.status !== 'active' && userData.status !== 'suspended') {
            return res.status(403).json({ error: 'Account is not active' });
          }
        } else {
          if (!userData.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
          }
        }
        
        cachedUser = {
          uid: payload.uid,
          email: payload.email,
          role: payload.role,
          ...userData
        };
        
        // Cache for 5 minutes
        cache.set(cacheKey, cachedUser, 5 * 60 * 1000);
      }
      
      req.user = cachedUser;
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      try {
        const payload = verifyAccessToken(token);
        let userResult = await supabase
          .from('users')
          .select('*')
          .eq('uid', payload.uid)
          .limit(1);
        
        let isCustomer = false;
        let userData;

        if (!userResult.data || userResult.data.length === 0 && payload.role === 'customer') {
          const customerResult = await supabase
            .from('customers')
            .select('*')
            .eq('uid', payload.uid)
            .limit(1);
          
          if (customerResult.data && customerResult.data.length > 0) {
            userData = customerResult.data[0];
            isCustomer = true;
          }
        } else if (userResult.data && userResult.data.length > 0) {
          userData = userResult.data[0];
        }

        if (userData) {
          req.user = {
            uid: payload.uid,
            email: payload.email,
            role: payload.role,
            ...userData
          };
        }
      } catch (error) {
        // Token invalid, but we continue without user
      }
    }
    
    next();
  } catch (error) {
    // Optional authentication error - continuing without user
    next();
  }
};


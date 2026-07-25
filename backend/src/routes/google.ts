import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { googleOAuthService } from '../services/google-oauth';
import { googleContactsService } from '../services/google-contacts';
import { getSupabaseClient } from '../database/client';
import { logger } from '../utils/logger';

const router = express.Router();
const supabase = getSupabaseClient();

/**
 * GET /api/google/auth-url
 * Get Google OAuth authorization URL
 */
router.get('/auth-url', authenticate, async (req: AuthRequest, res) => {
  try {
    const state = req.query.state as string || '';
    const authUrl = googleOAuthService.getAuthUrl(state);
    
    res.json({ authUrl });
  } catch (error: any) {
    logger.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * POST /api/google/callback
 * Handle Google OAuth callback
 */
router.post('/callback', authenticate, [
  body('code').notEmpty(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { code } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Exchange code for tokens
    const { tokens, userInfo } = await googleOAuthService.exchangeCodeForTokens(code);

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', userId)
      .limit(1)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store tokens
    await googleOAuthService.storeTokens(userData.id, tokens, userInfo.email);

    res.json({ 
      message: 'Google account connected successfully',
      email: userInfo.email
    });
  } catch (error: any) {
    logger.error('Error handling Google callback:', error);
    res.status(500).json({ error: 'Failed to connect Google account' });
  }
});

/**
 * GET /api/google/status
 * Get Google connection status
 */
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', userId)
      .limit(1)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accountInfo = await googleOAuthService.getConnectedAccount(userData.id);
    const syncStats = await googleContactsService.getSyncStatistics(userData.id);

    res.json({
      connected: accountInfo.connected,
      email: accountInfo.email,
      configured: googleOAuthService.isConfigured(),
      sync: syncStats
    });
  } catch (error: any) {
    logger.error('Error getting Google status:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
});

/**
 * POST /api/google/disconnect
 * Disconnect Google account
 */
router.post('/disconnect', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', userId)
      .limit(1)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    await googleOAuthService.revokeConnection(userData.id);

    res.json({ message: 'Google account disconnected successfully' });
  } catch (error: any) {
    logger.error('Error disconnecting Google account:', error);
    res.status(500).json({ error: 'Failed to disconnect Google account' });
  }
});

/**
 * POST /api/google/change-account
 * Change Google account (disconnect and prompt for new connection)
 */
router.post('/change-account', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', userId)
      .limit(1)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Revoke current connection
    await googleOAuthService.revokeConnection(userData.id);

    // Generate new auth URL
    const authUrl = googleOAuthService.getAuthUrl('change-account');

    res.json({ 
      message: 'Account disconnected. Please connect new account.',
      authUrl
    });
  } catch (error: any) {
    logger.error('Error changing Google account:', error);
    res.status(500).json({ error: 'Failed to change Google account' });
  }
});

/**
 * POST /api/google/sync/customer/:id
 * Sync a single customer to Google Contacts
 */
router.post('/sync/customer/:id', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', userId)
      .limit(1)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .limit(1)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check sync status
    const syncStatus = await googleContactsService.getSyncStatus(customerId);

    if (syncStatus.synced && syncStatus.googleContactId) {
      // Update existing contact
      const updated = await googleContactsService.updateContact(userData.id, customer, syncStatus.googleContactId);
      if (updated) {
        res.json({ message: 'Contact updated successfully' });
      } else {
        res.status(500).json({ error: 'Failed to update contact' });
      }
    } else {
      // Check for existing contact
      const existingContactId = await googleContactsService.findExistingContact(
        userData.id, 
        customer.mobile, 
        customer.email
      );

      if (existingContactId) {
        // Link to existing contact and update
        const updated = await googleContactsService.updateContact(userData.id, customer, existingContactId);
        if (updated) {
          res.json({ message: 'Contact linked and updated successfully' });
        } else {
          res.status(500).json({ error: 'Failed to update contact' });
        }
      } else {
        // Create new contact
        const contactId = await googleContactsService.createContact(userData.id, customer);
        if (contactId) {
          res.json({ message: 'Contact created successfully', contactId });
        } else {
          res.status(500).json({ error: 'Failed to create contact' });
        }
      }
    }
  } catch (error: any) {
    logger.error('Error syncing customer to Google Contacts:', error);
    res.status(500).json({ error: 'Failed to sync customer' });
  }
});

/**
 * POST /api/google/sync/all
 * Sync all customers to Google Contacts
 */
router.post('/sync/all', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', userId)
      .limit(1)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await googleContactsService.syncAllCustomers(userData.id);

    res.json({ 
      message: `Sync completed: ${result.success} successful, ${result.failed} failed`,
      success: result.success,
      failed: result.failed
    });
  } catch (error: any) {
    logger.error('Error syncing all customers to Google Contacts:', error);
    res.status(500).json({ error: 'Failed to sync customers' });
  }
});

/**
 * GET /api/google/sync/status/:customerId
 * Get sync status for a specific customer
 */
router.get('/sync/status/:customerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const syncStatus = await googleContactsService.getSyncStatus(customerId);

    res.json(syncStatus);
  } catch (error: any) {
    logger.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

/**
 * POST /api/google/test-connection
 * Test Google connection
 */
router.post('/test-connection', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', userId)
      .limit(1)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessToken = await googleOAuthService.getValidAccessToken(userData.id);

    if (accessToken) {
      res.json({ connected: true, message: 'Connection is valid' });
    } else {
      res.json({ connected: false, message: 'Connection is invalid or expired' });
    }
  } catch (error: any) {
    logger.error('Error testing Google connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

export default router;

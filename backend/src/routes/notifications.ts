import express from 'express';
import { logger } from '../utils/logger';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getSupabaseClient } from '../database/client';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  createNotification,
  createUnpaidBillReminder,
  createOverdueBillNotifications,
  cleanupExpiredNotifications
} from '../services/notifications';

const supabase = getSupabaseClient();

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get notifications for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get database user ID from Firebase UID
    const { data: user } = await supabase.from('users').select('id').eq('uid', firebaseUid).limit(1).single();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { unreadOnly = 'false', limit = '20' } = req.query;
    const notifications = await getUserNotifications(
      user.id,
      unreadOnly === 'true',
      parseInt(limit as string)
    );

    res.json({ notifications });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count for current user
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get database user ID from Firebase UID
    const { data: user } = await supabase.from('users').select('id').eq('uid', firebaseUid).limit(1).single();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const count = await getUnreadNotificationCount(user.id);
    res.json({ count });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get database user ID from Firebase UID
    const { data: user } = await supabase.from('users').select('id').eq('uid', firebaseUid).limit(1).single();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify notification belongs to user
    const { data: notification } = await supabase.from('notifications').select('user_id').eq('id', id).limit(1).single();
    if (!notification || notification.user_id !== user.id) {
      return res.status(403).json({ error: 'Notification not found or access denied' });
    }

    await markNotificationAsRead(id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get database user ID from Firebase UID
    const { data: user } = await supabase.from('users').select('id').eq('uid', firebaseUid).limit(1).single();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await markAllNotificationsAsRead(user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await deleteNotification(id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create custom notification (admin only)
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, type, title, message, actionUrl, actionText, relatedId, relatedType, expiresAt } = req.body;

    const notificationId = await createNotification({
      user_id: userId,
      type,
      title,
      message,
      action_url: actionUrl,
      action_text: actionText,
      related_id: relatedId,
      related_type: relatedType,
      is_read: false,
      expires_at: expiresAt,
    });

    res.status(201).json({ id: notificationId, message: 'Notification created successfully' });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Trigger unpaid bill reminders (admin only)
router.post('/reminders/unpaid-bills', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await createUnpaidBillReminder();
    res.json({ message: 'Unpaid bill reminders created successfully' });
  } catch (error) {
    logger.error('Create unpaid bill reminders error:', error);
    res.status(500).json({ error: 'Failed to create unpaid bill reminders' });
  }
});

// Trigger overdue bill notifications (admin only)
router.post('/reminders/overdue-bills', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await createOverdueBillNotifications();
    res.json({ message: 'Overdue bill notifications created successfully' });
  } catch (error) {
    logger.error('Create overdue bill notifications error:', error);
    res.status(500).json({ error: 'Failed to create overdue bill notifications' });
  }
});

// Cleanup expired notifications (admin only)
router.post('/cleanup', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const count = await cleanupExpiredNotifications();
    res.json({ message: `Cleaned up ${count} expired notifications` });
  } catch (error) {
    logger.error('Cleanup expired notifications error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired notifications' });
  }
});

export default router;


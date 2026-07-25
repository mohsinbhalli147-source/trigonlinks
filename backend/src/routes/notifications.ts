import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
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

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get notifications for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { unreadOnly = 'false', limit = '20' } = req.query;
    const notifications = await getUserNotifications(
      userId,
      unreadOnly === 'true',
      parseInt(limit as string)
    );

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count for current user
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const count = await getUnreadNotificationCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await markNotificationAsRead(id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for current user
router.put('/read-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await markAllNotificationsAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await deleteNotification(id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
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
    console.error('Create notification error:', error);
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
    console.error('Create unpaid bill reminders error:', error);
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
    console.error('Create overdue bill notifications error:', error);
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
    console.error('Cleanup expired notifications error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired notifications' });
  }
});

export default router;


import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AnnouncementsRepository } from '../repositories/AnnouncementsRepository';
import { getSupabaseClient } from '../database/client';
import { createBulkNotifications } from '../services/notifications';
import { logger } from '../utils/logger';

const router = express.Router();
const announcementsRepo = new AnnouncementsRepository();
const supabase = getSupabaseClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all announcements (admin and staff can view)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
      target = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await announcementsRepo.paginateAnnouncements({
      page: pageNum,
      limit: limitNum,
      status: status as any,
      target: target as string,
      search: search as string,
    });

    res.json(result);
  } catch (error) {
    logger.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement (admin and staff can view)
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const announcement = await announcementsRepo.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Create announcement (admin only)
router.post('/', authorize('admin'), [
  body('title').notEmpty(),
  body('message').notEmpty(),
  body('target').notEmpty(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const announcementData = {
      title: req.body.title,
      message: req.body.message,
      target: req.body.target,
      status: req.body.status || 'active',
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const announcement = await announcementsRepo.createAnnouncement(announcementData);
    
    // Create notifications for all target users
    let query = supabase.from('users').select('id').eq('is_active', true);
    
    if (req.body.target === 'staff') {
      query = query.eq('role', 'staff');
    } else if (req.body.target === 'admin') {
      query = query.eq('role', 'admin');
    } else if (req.body.target === 'customer') {
      query = query.eq('role', 'customer');
    }
    
    const { data: users } = await query;
    if (users && users.length > 0) {
      const userIds = users.map(u => u.id);
      await createBulkNotifications(userIds, {
        type: 'announcement',
        title: req.body.title,
        message: req.body.message,
        action_url: '/announcements',
        action_text: 'View Details',
        related_id: announcement.id,
        related_type: 'announcement',
        is_read: false,
        expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000),
      });
    }
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const announcement = await announcementsRepo.updateAnnouncement(req.params.id, updateData);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await announcementsRepo.deleteAnnouncement(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// Get active announcements (authenticated)
router.get('/active/list', authenticate, async (req, res) => {
  try {
    const announcements = await announcementsRepo.findActiveAnnouncements();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active announcements' });
  }
});

// Get announcements by target (authenticated)
router.get('/target/:target', authenticate, async (req, res) => {
  try {
    const announcements = await announcementsRepo.findByTarget(req.params.target);
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements by target' });
  }
});

export default router;


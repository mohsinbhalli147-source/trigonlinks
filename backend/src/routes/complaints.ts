import express from 'express';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { ComplaintsRepository } from '../repositories/ComplaintsRepository';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { getSupabaseClient } from '../database/client';
import { createNotification } from '../services/notifications';

const router = express.Router();
const complaintsRepo = new ComplaintsRepository();
const customersRepo = new CustomersRepository();
const supabase = getSupabaseClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all complaints (admin, staff, and customer can view with appropriate filters)
router.get('/', authorize('admin', 'staff', 'customer'), async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
      priority = '',
      customerId = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Validate pagination parameters
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page parameter' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit parameter' });
    }

    // For customers, get their customer ID from their uid
    let effectiveCustomerId = customerId as string;
    if (req.user?.role === 'customer') {
      const customer = await customersRepo.findByUid(req.user.uid);
      effectiveCustomerId = customer?.id || '';
    }

    const result = await complaintsRepo.paginateComplaints({
      page: pageNum,
      limit: limitNum,
      customer_id: effectiveCustomerId,
      status: status as any,
      priority: priority as any,
      search: search as string,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints', details: error.message });
  }
});

// Get single complaint (admin and staff can view)
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const complaint = await complaintsRepo.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Create complaint (admin, staff, and customer can create)
router.post('/', authorize('admin', 'staff', 'customer'), [
  body('customer_id').notEmpty(),
  body('category').notEmpty(),
  body('description').notEmpty(),
  body('priority').optional(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const complaintData = {
      customer_id: req.body.customer_id,
      customer_name: req.body.customer_name,
      category: req.body.category,
      description: req.body.description,
      status: req.body.status || 'pending',
      priority: req.body.priority || 'medium',
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const complaint = await complaintsRepo.createComplaint(complaintData);
    
    // Create notification for customer when complaint is submitted
    const customer = await customersRepo.findById(req.body.customer_id);
    if (customer && customer.uid) {
      const user = await supabase.from('users').select('id').eq('uid', customer.uid).limit(1).single();
      if (user.data) {
        await createNotification({
          user_id: user.data.id,
          type: 'complaint',
          title: 'Complaint Submitted',
          message: `Your complaint regarding ${req.body.category} has been submitted successfully. Reference ID: ${complaint.id}`,
          action_url: '/complaints',
          action_text: 'View Complaints',
          related_id: complaint.id,
          related_type: 'complaint',
          is_read: false,
          expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000),
        });
      }
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Update complaint (admin and staff can update)
router.put('/:id', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const existingComplaint = await complaintsRepo.findById(req.params.id);
    if (!existingComplaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const oldStatus = existingComplaint.status;
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const complaint = await complaintsRepo.updateComplaint(req.params.id, updateData);
    
    // Create notification for customer when complaint status changes
    if (oldStatus !== complaint.status) {
      const customer = await customersRepo.findById(complaint.customer_id);
      if (customer && customer.uid) {
        const user = await supabase.from('users').select('id').eq('uid', customer.uid).limit(1).single();
        if (user.data) {
          let title = 'Complaint Status Updated';
          let message = `Your complaint status has been updated to: ${complaint.status}`;
          
          if (complaint.status === 'resolved') {
            title = 'Complaint Resolved';
            message = `Your complaint regarding ${complaint.category} has been resolved. Thank you for your patience.`;
          } else if (complaint.status === 'in-progress') {
            title = 'Complaint In Progress';
            message = `Your complaint is being investigated and worked on by our team.`;
          }
          
          await createNotification({
            user_id: user.data.id,
            type: 'complaint',
            title,
            message,
            action_url: '/complaints',
            action_text: 'View Complaints',
            related_id: complaint.id,
            related_type: 'complaint',
            is_read: false,
            expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000),
          });
        }
      }
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// Delete complaint (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await complaintsRepo.deleteComplaint(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

// Get complaints by status (admin and staff)
router.get('/status/:status', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await complaintsRepo.paginateComplaints({
      page: pageNum,
      limit: limitNum,
      status: req.params.status as any,
    });

    res.json({
      complaints: result.data,
      total: result.pagination.total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints by status' });
  }
});

// Get complaints by customer (admin, staff, customer)
router.get('/customer/:customerId', authorize('admin', 'staff', 'customer'), async (req: AuthRequest, res) => {
  try {
    // Customer can only see their own complaints
    if (req.user?.role === 'customer' && req.user.uid !== req.params.customerId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await complaintsRepo.paginateComplaints({
      page: pageNum,
      limit: limitNum,
      customer_id: req.params.customerId,
    });

    res.json({
      complaints: result.data,
      total: result.pagination.total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer complaints' });
  }
});

export default router;


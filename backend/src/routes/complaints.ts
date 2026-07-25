import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { ComplaintsRepository } from '../repositories/ComplaintsRepository';
import { CustomersRepository } from '../repositories/CustomersRepository';

const router = express.Router();
const complaintsRepo = new ComplaintsRepository();
const customersRepo = new CustomersRepository();

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
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
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
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Update complaint (admin and staff can update)
router.put('/:id', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const complaint = await complaintsRepo.updateComplaint(req.params.id, updateData);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
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


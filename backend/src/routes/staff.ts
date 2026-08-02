import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { StaffRepository } from '../repositories/StaffRepository';
import { getSupabaseClient } from '../database/client';
import { cache } from '../utils/cache';
import { hashPassword } from '../utils/auth';

const router = express.Router();
const supabase = getSupabaseClient();
const staffRepo = new StaffRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all staff (admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
      role = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await staffRepo.paginateStaff({
      page: pageNum,
      limit: limitNum,
      status: status as any,
      role: role as any,
      search: search as string,
    });

    res.json(result);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Get staff performance reports (admin only)
router.get('/reports', authorize('admin'), async (req, res) => {
  try {
    const { month, role } = req.query;

    // Fetch all staff
    let staffList = await staffRepo.findAll();
    if (role && role !== 'all') {
      staffList = staffList.filter(s => s.role === role);
    }

    if (staffList.length === 0) {
      return res.json([]);
    }

    // Build date range for the month filter
    let startTs: number | undefined;
    let endTs: number | undefined;
    if (month) {
      const [year, mon] = (month as string).split('-').map(Number);
      startTs = new Date(year, mon - 1, 1).getTime();
      endTs = new Date(year, mon, 1).getTime();
    }

    // Aggregate payments collected by each staff member
    let paymentsQuery = supabase.from('payments').select('collected_by, amount');
    if (startTs) {
      paymentsQuery = paymentsQuery.gte('created_at', startTs).lt('created_at', endTs);
    }
    
    const { data: paymentsData } = await paymentsQuery;
    const paymentsByStaff: Record<string, number> = {};
    (paymentsData || []).forEach((row: any) => {
      if (row.collected_by) {
        paymentsByStaff[row.collected_by] = (paymentsByStaff[row.collected_by] || 0) + Number(row.amount || 0);
      }
    });

    // Aggregate connections assigned to each staff member
    let connectionsQuery = supabase.from('connections').select('assigned_staff');
    if (startTs) {
      connectionsQuery = connectionsQuery.gte('created_at', startTs).lt('created_at', endTs);
    }
    
    const { data: connectionsData } = await connectionsQuery;
    const connectionsByStaff: Record<string, number> = {};
    (connectionsData || []).forEach((row: any) => {
      if (row.assigned_staff) {
        connectionsByStaff[row.assigned_staff] = (connectionsByStaff[row.assigned_staff] || 0) + 1;
      }
    });

    // Combine into performance array
    const performances = staffList.map((staff: any) => ({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      totalPayments: paymentsByStaff[staff.id] || 0,
      totalConnections: connectionsByStaff[staff.id] || 0,
      customerSatisfaction: null, // Not tracked yet
      tasksCompleted: (paymentsByStaff[staff.id] ? 1 : 0) + (connectionsByStaff[staff.id] || 0),
      attendanceRate: null, // Not tracked yet
      month: month || null,
    }));

    res.json(performances);
  } catch (error) {
    console.error('Get staff reports error:', error);
    res.status(500).json({ error: 'Failed to fetch staff reports' });
  }
});

// Get single staff member (admin only)
router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const staff = await staffRepo.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

// Create staff (admin only)
router.post('/', authorize('admin'), [
  body('name').notEmpty(),
  body('username').notEmpty(),
  body('password').notEmpty(),
  body('role').notEmpty(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Validate assigned_area if provided
    if (req.body.assigned_area) {
      const { data: areaData } = await supabase
        .from('areas')
        .select('name')
        .eq('name', req.body.assigned_area)
        .limit(1);
      
      if (!areaData || areaData.length === 0) {
        return res.status(400).json({ error: 'Area not found' });
      }
    }

    const staffData: any = {
      uid: req.body.uid || crypto.randomUUID(),
      name: req.body.name,
      username: req.body.username,
      password_hash: req.body.password_hash || await hashPassword(req.body.password),
      phone: req.body.phone || req.body.mobile,
      email: req.body.email,
      role: req.body.role,
      status: req.body.status || 'active',
      assigned_area: req.body.assigned_area,
      permissions: req.body.permissions || { view: true, add: false, edit: false, delete: false, approve: false },
      rating: req.body.rating || 0,
      salary: req.body.salary || 0,
      hire_date: req.body.hire_date || req.body.joinedDate ? new Date(req.body.joinedDate).getTime() : Date.now(),
      created_at: Date.now(),
      updated_at: Date.now(),
      created_by: req.user?.uid,
    };

    // Only include address if it's provided (column may not exist in database)
    if (req.body.address) {
      staffData.address = req.body.address;
    }
    
    const staff = await staffRepo.createStaff(staffData);
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(staff);
  } catch (error: any) {
    console.error('Create staff error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      body: req.body
    });
    res.status(500).json({ error: 'Failed to create staff', details: error.message });
  }
});

// Update staff (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const staff = await staffRepo.updateStaff(req.params.id, updateData);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// Delete staff (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await staffRepo.deleteStaff(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

export default router;


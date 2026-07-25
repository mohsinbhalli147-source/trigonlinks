import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getSupabaseClient } from '../database/client';

const router = express.Router();
const supabase = getSupabaseClient();

router.use(authenticate);

router.get('/', authorize('admin'), async (req, res) => {
  try {
    const [adminResult, staffResult, customerResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'staff'),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
    ]);

    const adminCount = adminResult.count || 0;
    const staffCount = staffResult.count || 0;
    const customerCount = customerResult.count || 0;

    const roles = [
      {
        id: 'admin',
        name: 'Admin',
        description: 'Full system administrator access',
        permissions: ['view', 'add', 'edit', 'delete', 'approve'],
        userCount: adminCount,
      },
      {
        id: 'staff',
        name: 'Staff',
        description: 'Standard staff/operator access',
        permissions: ['view', 'add', 'edit'],
        userCount: staffCount,
      },
      {
        id: 'customer',
        name: 'Customer',
        description: 'Portal user access',
        permissions: ['view'],
        userCount: customerCount,
      }
    ];

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

export default router;


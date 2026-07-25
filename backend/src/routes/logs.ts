import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getSupabaseClient } from '../database/client';

const router = express.Router();
const supabase = getSupabaseClient();

router.use(authenticate);

router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json([]);
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;


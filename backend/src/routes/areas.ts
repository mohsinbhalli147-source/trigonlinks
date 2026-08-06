import express from 'express';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AreasRepository } from '../repositories/AreasRepository';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { getSupabaseClient } from '../database/client';
import { cache } from '../utils/cache';

const router = express.Router();
const supabase = getSupabaseClient();
const areasRepo = new AreasRepository();
const customersRepo = new CustomersRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all areas (admin and staff can view)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await areasRepo.paginateAreas({
      page: pageNum,
      limit: limitNum,
      status: status as any,
      search: search as string,
    });

    res.json(result);
  } catch (error) {
    logger.error('Get areas error:', error);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// Get single area (admin and staff can view)
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const area = await areasRepo.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch area' });
  }
});

// Create area (admin only)
router.post('/', authorize('admin'), [
  body('name').notEmpty(),
  body('status').optional(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const areaData = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status || 'active',
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const area = await areasRepo.createArea(areaData);
    
    // Invalidate caches
    cache.deletePattern(/^dashboard:/);
    
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create area' });
  }
});

// Update area (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const area = await areasRepo.updateArea(req.params.id, updateData);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    
    // Invalidate caches
    cache.deletePattern(/^dashboard:/);
    
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update area' });
  }
});

// Delete area (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await areasRepo.deleteArea(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Area not found' });
    }
    
    // Invalidate caches
    cache.deletePattern(/^dashboard:/);
    
    res.json({ message: 'Area deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete area' });
  }
});

// Get customers in area (with count optimization)
router.get('/:id/customers', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const areaName = req.params.id;

    const [totalResult, dataResult] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('area', areaName),
      supabase
        .from('customers')
        .select('id, name, mobile, status, package, fee, install_date')
        .eq('area', areaName)
        .order('name', { ascending: true })
        .range(offset, offset + limitNum - 1),
    ]);

    const total = totalResult.count || 0;

    res.json({
      customers: dataResult.data || [],
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch area customers' });
  }
});

// Get area revenue (monthly invoices collected/pending for an area)
router.get('/:id/revenue', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { year = new Date().getFullYear().toString() } = req.query;
    const areaName = req.params.id;

    // Get area details
    const area = await areasRepo.findByName(areaName);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearNum = parseInt(year as string);

    // Build monthly windows for the year
    const monthlyWindows = monthNames.map((label, index) => ({
      label,
      start: new Date(yearNum, index, 1).getTime(),
      end: new Date(yearNum, index + 1, 0, 23, 59, 59, 999).getTime(),
    }));

    // Get all invoices for customers in this area
    const { data: invoicesResult } = await supabase
      .from('invoices')
      .select('paid_amount, amount, remaining_balance, status, created_at, customers!inner(area)')
      .eq('customers.area', areaName);
    
    const allInvoices = invoicesResult || [];

    // Get expenses for this area
    const { data: expensesResult } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('area', areaName);
    
    const areaExpenses = expensesResult || [];

    // Build monthly revenue data
    const revenueData = monthlyWindows.map(window => {
      const monthInvoices = allInvoices.filter(inv => {
        const ts = Number(inv.created_at) || 0;
        return ts >= window.start && ts <= window.end;
      });
      const monthExpenses = areaExpenses.filter(exp => {
        const ts = Number(exp.date) || 0;
        return ts >= window.start && ts <= window.end;
      });

      const collected = monthInvoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
      const pending = monthInvoices.reduce((sum, inv) => sum + (Number(inv.remaining_balance) || 0), 0);
      const expenses = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      return {
        month: window.label,
        collected,
        pending,
        expenses,
        netRevenue: collected - expenses,
      };
    });

    const summary = revenueData.reduce((acc, r) => ({
      totalCollected: acc.totalCollected + r.collected,
      totalPending: acc.totalPending + r.pending,
      totalExpenses: acc.totalExpenses + r.expenses,
      totalNetRevenue: acc.totalNetRevenue + r.netRevenue,
    }), { totalCollected: 0, totalPending: 0, totalExpenses: 0, totalNetRevenue: 0 });

    res.json({ areaId: area.id, year, revenueData, summary });
  } catch (error) {
    logger.error('Get area revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch area revenue' });
  }
});

// Get area report stats (customer count, package distribution, connections)
router.get('/:id/report', authorize('admin', 'staff'), async (req, res) => {
  try {
    const areaName = req.params.id;

    const [customersResult, connectionsResult] = await Promise.all([
      supabase
        .from('customers')
        .select('status, package, fee, created_at')
        .eq('area', areaName),
      supabase
        .from('connections')
        .select('status')
        .eq('area', areaName),
    ]);

    const customers = customersResult.data || [];
    const connections = connectionsResult.data || [];

    const packageDist: Record<string, number> = {};
    customers.forEach(c => {
      if (c.package) packageDist[c.package] = (packageDist[c.package] || 0) + 1;
    });

    const packageDistribution = Object.entries(packageDist).map(([name, value]) => ({ name, value }));

    const approvedConnections = connections.filter(c => c.status === 'approved').length;
    const connectionSuccess = connections.length > 0 ? Math.round((approvedConnections / connections.length) * 100) : 0;

    // Build 6-month customer growth
    const now = new Date();
    const growth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return {
        month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d),
        customers: customers.filter(c => Number(c.created_at) <= end).length,
      };
    });

    res.json({
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      packageDistribution,
      connectionSuccess,
      customerGrowth: growth.map(g => g.customers),
      customerGrowthLabels: growth.map(g => g.month),
    });
  } catch (error) {
    logger.error('Get area report error:', error);
    res.status(500).json({ error: 'Failed to fetch area report' });
  }
});

export default router;



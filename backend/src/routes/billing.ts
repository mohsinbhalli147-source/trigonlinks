import express from 'express';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import {
  generateMonthlyBills,
  generateCustomerBill,
  processPayment,
  markOverdueInvoices,
  getCustomerBillingSummary,
  generateMonthlyBillsBackground
} from '../services/billing';
import { getSupabaseClient } from '../database/client';
import { StaffRepository } from '../repositories/StaffRepository';
import { InvoicesRepository } from '../repositories/InvoicesRepository';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { cache } from '../utils/cache';
import { runInBackground, getJob } from '../services/jobStore';

const router = express.Router();
const supabase = getSupabaseClient();
const staffRepo = new StaffRepository();
const customersRepo = new CustomersRepository();
const invoicesRepo = new InvoicesRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all billing records (admin and staff)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from('invoices').select('*', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const from = offset;
    const to = offset + limitNum - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;

    res.json({ data: data || [], pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }});
  } catch (error) {
    logger.error('Get billing records error:', error);
    res.status(500).json({ error: 'Failed to fetch billing records' });
  }
});

// Get all payments (admin and staff)
router.get('/payments', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const from = offset;
    const to = offset + limitNum - 1;
    
    const { data, count, error } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;

    res.json({ data: data || [], pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }});
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Generate monthly bills for all customers (admin only) — runs in background
router.post('/generate-monthly', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { forceAll, area } = req.body;

    // Count customers to be processed for job progress
    const customers = await customersRepo.findAll();
    let activeCustomers = customers.filter((c: any) => c.status === 'active');
    if (area) {
      activeCustomers = activeCustomers.filter((c: any) => c.area === area);
    }

    const adminUid = req.user?.uid || '';
    const jobId = runInBackground(
      area ? `generate-bills-area-${area}` : 'generate-bills-all',
      activeCustomers.length,
      (jid) => generateMonthlyBillsBackground(adminUid, !!forceAll, area, jid)
    );

    res.json({
      success: true,
      message: `Bill generation started in background${area ? ` for area: ${area}` : ''}. ${activeCustomers.length} customers to process.`,
      jobId,
      total: activeCustomers.length,
    });
  } catch (error) {
    logger.error('Generate monthly bills error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate monthly bills' });
  }
});

// Generate bills for a specific area (admin only) — background
router.post('/generate-area/:area', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { area } = req.params;

    const customers = await customersRepo.findAll();
    const areaCustomers = customers.filter((c: any) => c.status === 'active' && c.area === area);

    if (areaCustomers.length === 0) {
      return res.json({ success: false, message: `No active customers found in area: ${area}` });
    }

    const adminUid = req.user?.uid || '';
    const jobId = runInBackground(
      `generate-bills-area-${area}`,
      areaCustomers.length,
      (jid) => generateMonthlyBillsBackground(adminUid, true, area, jid)
    );

    res.json({
      success: true,
      message: `Bill generation started for area: ${area}. ${areaCustomers.length} customers to process.`,
      jobId,
      total: areaCustomers.length,
      area,
    });
  } catch (error) {
    logger.error('Generate area bills error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate area bills' });
  }
});

// Check status of a background bill generation job
router.get('/job/:jobId', authorize('admin', 'staff'), async (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({
    success: true,
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    },
  });
});

// Get list of distinct areas (for the area-wise generation UI)
router.get('/areas', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('area')
      .not('area', 'is', null)
      .neq('area', '');

    if (error) throw error;

    const areas = [...new Set((data || []).map((r: any) => r.area).filter(Boolean))].sort();
    res.json({ success: true, data: areas });
  } catch (error) {
    logger.error('Get areas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch areas' });
  }
});

// Manually trigger the auto-invoice cron run (admin only)
router.post('/auto-generate/trigger', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { getInvoiceScheduler } = await import('../services/invoice-scheduler');
    const scheduler = getInvoiceScheduler();
    const result = await scheduler.runNow();
    res.json({ success: true, message: 'Auto invoice generation triggered', ...result });
  } catch (error) {
    logger.error('Trigger auto-generate error:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger auto generation' });
  }
});

// Generate bill for specific customer (admin only)
router.post('/generate/:customerId', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const { customDate } = req.body;
    
    const date = customDate ? new Date(customDate) : undefined;
    const result = await generateCustomerBill(customerId, req.user?.uid || '', date);
    res.json(result);
  } catch (error) {
    logger.error('Generate customer bill error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate customer bill' });
  }
});

// Process payment for invoice (admin and staff)
router.post('/payment/:invoiceId', authorize('admin', 'staff'), [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { invoiceId } = req.params;
    const { amount, paymentMethod, discountAmount, discountReason } = req.body;

    const result = await processPayment(
      invoiceId,
      Number(amount),
      paymentMethod,
      req.user?.uid || '',
      discountAmount ? Number(discountAmount) : undefined,
      discountReason
    );

    // Invalidate dashboard cache after payment processing
    if (result.success) {
      cache.deletePattern(/^dashboard:/);
    }

    res.json(result);
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// Mark overdue invoices (admin only)
router.post('/mark-overdue', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await markOverdueInvoices();
    res.json(result);
  } catch (error) {
    logger.error('Mark overdue error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark overdue invoices' });
  }
});

// Get customer billing summary (admin and staff)
router.get('/summary/:customerId', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const summary = await getCustomerBillingSummary(customerId);
    res.json(summary);
  } catch (error) {
    logger.error('Get billing summary error:', error);
    res.status(500).json({ error: 'Failed to get billing summary' });
  }
});

// Get all staff payment records (admin and staff)
router.get('/payments/staff-records', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Build Supabase query for payments
    let query = supabase.from('payments').select('*', { count: 'exact' });
    
    if (search) query = query.ilike('customer_name', `%${search}%`);
    
    const from = offset;
    const to = offset + limitNum - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;

    const records = await Promise.all(
      (data || []).map(async (payment: any) => {
        const staff = payment.created_by ? await staffRepo.findById(payment.created_by) : null;
        const invoice = payment.invoice_id ? await invoicesRepo.findById(payment.invoice_id) : null;

        return {
          id: payment.id,
          staffName: staff?.name || 'Unknown',
          staffRole: staff?.role || 'staff',
          customerName: payment.customer_name || '',
          customerPhone: invoice?.customer_phone || '',
          customerPackage: invoice?.package || '',
          amount: payment.amount || 0,
          paymentMethod: payment.payment_method || '',
          paymentDate: payment.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : '',
          status: payment.status || 'completed',
          notes: payment.discount_reason || payment.notes || '',
          createdAt: payment.created_at || 0,
        };
      })
    );

    res.json({ data: records, pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }});
  } catch (error) {
    logger.error('Get staff payment records error:', error);
    res.status(500).json({ error: 'Failed to fetch staff payment records' });
  }
});

// Get payment history for a customer (admin and staff)
router.get('/payments/:customerId', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    const customerId = req.params.customerId;

    // Build Supabase query for payments
    let query = supabase.from('payments').select('*', { count: 'exact' }).eq('customer_id', customerId);
    
    if (search) query = query.ilike('customer_name', `%${search}%`);
    
    const from = offset;
    const to = offset + limitNum - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;

    const records = await Promise.all(
      (data || []).map(async (payment: any) => {
        const staff = payment.created_by ? await staffRepo.findById(payment.created_by) : null;
        const invoice = payment.invoice_id ? await invoicesRepo.findById(payment.invoice_id) : null;

        return {
          id: payment.id,
          staffName: staff?.name || 'Unknown',
          staffRole: staff?.role || 'staff',
          customerName: payment.customer_name || '',
          customerPhone: invoice?.customer_phone || '',
          customerPackage: invoice?.package || '',
          amount: payment.amount || 0,
          paymentMethod: payment.payment_method || '',
          paymentDate: payment.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : '',
          status: payment.status || 'completed',
          notes: payment.discount_reason || payment.notes || '',
          createdAt: payment.created_at || 0,
        };
      })
    );

    res.json({ data: records, pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }});
  } catch (error) {
    logger.error('Get staff payment records error:', error);
    res.status(500).json({ error: 'Failed to fetch staff payment records' });
  }
});

export default router;


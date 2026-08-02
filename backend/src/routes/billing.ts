import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import {
  generateMonthlyBills,
  generateCustomerBill,
  processPayment,
  markOverdueInvoices,
  getCustomerBillingSummary
} from '../services/billing';
import { getSupabaseClient } from '../database/client';
import { StaffRepository } from '../repositories/StaffRepository';
import { InvoicesRepository } from '../repositories/InvoicesRepository';

const router = express.Router();
const supabase = getSupabaseClient();
const staffRepo = new StaffRepository();
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
    console.error('Get billing records error:', error);
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
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Generate monthly bills for all customers (admin only)
router.post('/generate-monthly', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { forceAll } = req.body;
    const result = await generateMonthlyBills(req.user?.uid || '', forceAll);
    res.json(result);
  } catch (error) {
    console.error('Generate monthly bills error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate monthly bills' });
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
    console.error('Generate customer bill error:', error);
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
    res.json(result);
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// Mark overdue invoices (admin only)
router.post('/mark-overdue', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await markOverdueInvoices();
    res.json(result);
  } catch (error) {
    console.error('Mark overdue error:', error);
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
    console.error('Get billing summary error:', error);
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
    console.error('Get staff payment records error:', error);
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
    console.error('Get staff payment records error:', error);
    res.status(500).json({ error: 'Failed to fetch staff payment records' });
  }
});

export default router;


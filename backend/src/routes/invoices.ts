import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { InvoicesRepository } from '../repositories/InvoicesRepository';
import { PaymentsRepository } from '../repositories/PaymentsRepository';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { getSupabaseClient } from '../database/client';
import { cache } from '../utils/cache';

const router = express.Router();
const supabase = getSupabaseClient();
const invoicesRepo = new InvoicesRepository();
const paymentsRepo = new PaymentsRepository();
const customersRepo = new CustomersRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all invoices (admin, staff, customer)
router.get('/', authorize('admin', 'staff', 'customer'), async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
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

    const result = await invoicesRepo.paginateInvoices({
      page: pageNum,
      limit: limitNum,
      customer_id: effectiveCustomerId,
      status: status as any,
      search: search as string,
    });

    res.json(result);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get payment approval requests (admin only)
router.get('/approval-requests', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { status = 'pending', page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await paymentsRepo.paginatePayments({
      page: pageNum,
      limit: limitNum,
      approval_status: status as any,
    });

    res.json({
      requests: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get approval requests error:', error);
    res.status(500).json({ error: 'Failed to fetch approval requests' });
  }
});

// Get single invoice
router.get('/:id', authorize('admin', 'staff', 'customer'), async (req: AuthRequest, res) => {
  try {
    const invoice = await invoicesRepo.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user?.role === 'customer') {
      const customer = await customersRepo.findByUid(req.user.uid);
      if (invoice.customer_id !== customer?.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create invoice (admin only)
router.post('/', authorize('admin'), [
  body('customer_id').notEmpty(),
  body('customer_name').notEmpty(),
  body('amount').isNumeric(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const invoiceData = {
      customer_id: req.body.customer_id,
      customer_name: req.body.customer_name,
      customer_phone: req.body.customer_phone,
      package: req.body.package,
      amount: Number(req.body.amount),
      paid_amount: req.body.paid_amount || 0,
      remaining_balance: Number(req.body.amount) - (req.body.paid_amount || 0),
      discount_amount: req.body.discount_amount || 0,
      status: req.body.status || 'unpaid',
      due_date: req.body.due_date,
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const invoice = await invoicesRepo.createInvoice(invoiceData);
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const invoice = await invoicesRepo.updateInvoice(req.params.id, updateData);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Delete invoice (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await invoicesRepo.deleteInvoice(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// Approve a payment (admin only)
router.put('/:id/approve', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentsRepo.updatePayment(id, {
      approval_status: 'approved',
      approved_by: req.user?.uid,
      approved_at: Date.now(),
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    cache.deletePattern(/^dashboard:/);
    res.json({ message: 'Payment approved successfully' });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// Reject a payment (admin only)
router.put('/:id/reject', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const payment = await paymentsRepo.updatePayment(id, {
      approval_status: 'rejected',
      rejected_by: req.user?.uid,
      rejected_at: Date.now(),
      rejection_reason: reason || '',
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    cache.deletePattern(/^dashboard:/);
    res.json({ message: 'Payment rejected' });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

export default router;


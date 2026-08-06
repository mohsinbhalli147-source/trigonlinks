import express from 'express';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { ExpensesRepository } from '../repositories/ExpensesRepository';
import { getSupabaseClient } from '../database/client';
import { cache } from '../utils/cache';

const router = express.Router();
const supabase = getSupabaseClient();
const expensesRepo = new ExpensesRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all expenses (admin and staff can view)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const startDateNum = startDate ? new Date(startDate as string).getTime() : undefined;
    const endDateNum = endDate ? new Date(endDate as string).getTime() : undefined;

    const result = await expensesRepo.paginateExpenses({
      page: pageNum,
      limit: limitNum,
      category: category as string,
      startDate: startDateNum,
      endDate: endDateNum,
      search: search as string,
    });

    res.json(result);
  } catch (error) {
    logger.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense categories
router.get('/categories', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Get expense categories error:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
});

// Get single expense (admin and staff can view)
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const expense = await expensesRepo.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create expense (admin only)
router.post('/', authorize('admin'), [
  body('category').notEmpty(),
  body('amount').isNumeric(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!req.body.name && !req.body.title) {
    return res.status(400).json({ errors: [{ msg: 'name or title is required' }] });
  }

  try {
    const expenseData = {
      name: req.body.name,
      title: req.body.title,
      category: req.body.category,
      amount: Number(req.body.amount),
      date: req.body.date || Date.now(),
      description: req.body.description,
      area: req.body.area,
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const expense = await expensesRepo.createExpense(expenseData);
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const expense = await expensesRepo.updateExpense(req.params.id, updateData);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await expensesRepo.deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

router.post('/categories', authorize('admin'), [
  body('name').notEmpty(),
  body('budget').isNumeric()
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const categoryData = {
      name: req.body.name,
      description: req.body.description || '',
      budget: Number(req.body.budget),
      spent: Number(req.body.spent || 0),
      color: req.body.color || '#4C8DFF',
      created_at: Date.now(),
      created_by: req.user?.uid
    };

    const { data: result, error: insertError } = await supabase
      .from('expense_categories')
      .insert(categoryData)
      .select('*')
      .limit(1);

    if (insertError) throw insertError;
    res.json(result![0]);
  } catch (error) {
    logger.error('Create expense category error:', error);
    res.status(500).json({ error: 'Failed to create expense category' });
  }
});

router.delete('/categories/:id', authorize('admin'), async (req, res) => {
  try {
    await supabase.from('expense_categories').delete().eq('id', req.params.id);
    res.json({ message: 'Expense category deleted successfully' });
  } catch (error) {
    logger.error('Delete expense category error:', error);
    res.status(500).json({ error: 'Failed to delete expense category' });
  }
});

router.put('/categories/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData: any = {
      name: req.body.name,
      description: req.body.description,
      budget: req.body.budget !== undefined ? Number(req.body.budget) : undefined,
      spent: req.body.spent !== undefined ? Number(req.body.spent) : undefined,
      color: req.body.color,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };

    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data: result, error: updateError } = await supabase
      .from('expense_categories')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .limit(1);

    if (updateError) throw updateError;
    res.json(result![0]);
  } catch (error) {
    logger.error('Update expense category error:', error);
    res.status(500).json({ error: 'Failed to update expense category' });
  }
});

export default router;


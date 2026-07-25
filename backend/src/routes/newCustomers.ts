import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getSupabaseClient } from '../database/client';
import crypto from 'crypto';

const router = express.Router();
const supabase = getSupabaseClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all new customers (admin and staff can view)
// New Customers = customers with 'inactive' status created via connection requests
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Query customers table, joining with connections to get connection details
    let query = supabase
      .from('customers')
      .select(`
        *,
        connections!inner(id, status, installation_date, package, area, phone, created_at)
      `, { count: 'exact' });

    // Filter by customer status (inactive by default for new customers, or all if not specified)
    if (status) {
      query = query.eq('connections.status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,area.ilike.%${search}%`);
    }

    const sortOrderStr = String(sortOrder).toUpperCase() === 'ASC';
    const from = offset;
    const to = offset + limitNum - 1;

    const { data, count, error } = await query
      .order(sortBy as string, { ascending: sortOrderStr })
      .range(from, to);

    if (error) throw error;

    // Flatten and reshape data for frontend compatibility
    const formattedData = (data || []).map((customer: any) => {
      const connection = customer.connections?.[0] || {};
      return {
        id: connection.id || customer.id,
        customer_id: customer.id,
        customer_name: customer.name,
        area: customer.area,
        package: customer.package,
        status: connection.status || 'pending',
        installation_date: connection.installation_date,
        phone: customer.mobile,
        created_at: customer.created_at,
        notes: customer.notes,
      };
    });

    res.json({
      data: formattedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get new customers error:', error);
    res.status(500).json({ error: 'Failed to fetch new customers' });
  }
});

// Create new customer (admin only)
router.post('/', authorize('admin'), [
  body('name').notEmpty(),
  body('mobile').notEmpty(),
  body('area').notEmpty(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, mobile, address, area, installationCost, status } = req.body;
    
    // Generate UID for the customer
    const uid = crypto.randomUUID();
    
    // First create the customer record
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert({
        uid,
        name,
        mobile,
        address,
        area,
        status: status === 'pending' ? 'inactive' : (status || 'inactive'),
        package: 'Pending',
        fee: 0,
        created_at: Date.now(),
        created_by: req.user?.uid,
      })
      .select('id')
      .limit(1);

    if (customerError) throw customerError;
    
    const customerId = customerData![0].id;
    
    // Then create a connection record
    const connectionData = {
      customer_id: customerId,
      customer_name: name,
      package: 'Pending',
      area,
      status: status || 'pending',
      installation_date: installationCost ? Date.now() : null,
      notes: `Installation cost: ${installationCost || 0}`,
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const { data: connectionResult, error: connectionError } = await supabase
      .from('connections')
      .insert(connectionData)
      .select('id')
      .limit(1);

    if (connectionError) throw connectionError;
    
    res.json({ 
      id: connectionResult![0].id,
      customerId,
      ...connectionData 
    });
  } catch (error) {
    console.error('Create new customer error:', error);
    res.status(500).json({ error: 'Failed to create new customer' });
  }
});

// Get all new customer expenses (admin and staff can view)
router.get('/expenses', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      customerId = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Build Supabase query using connection_expenses table
    let query = supabase.from('connection_expenses').select('*', { count: 'exact' });
    
    if (category) query = query.eq('title', category);
    if (customerId) query = query.eq('connection_id', customerId);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    
    const sortOrderStr = String(sortOrder).toUpperCase() === 'ASC';
    
    const from = offset;
    const to = offset + limitNum - 1;
    
    const { data, count, error } = await query
      .order(sortBy as string, { ascending: sortOrderStr })
      .range(from, to);

    if (error) throw error;

    res.json({
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get new customer expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch new customer expenses' });
  }
});

// Create new customer expense (admin only)
router.post('/expenses', authorize('admin'), [
  body('name').notEmpty(),
  body('customerId').notEmpty(),
  body('category').notEmpty(),
  body('amount').isNumeric(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, customerId, category, amount, description } = req.body;
    const expenseData = {
      title: name,
      connection_id: customerId,
      quantity: 1,
      unit_cost: Number(amount),
      total_cost: Number(amount),
      description,
      created_at: new Date().toISOString(),
    };
    
    const { data: result, error: insertError } = await supabase
      .from('connection_expenses')
      .insert(expenseData)
      .select('id')
      .limit(1);

    if (insertError) throw insertError;
    
    res.json({ id: result![0].id, ...expenseData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create new customer expense' });
  }
});

// Delete new customer expense (admin only)
router.delete('/expenses/:id', authorize('admin'), async (req, res) => {
  try {
    await supabase.from('connection_expenses').delete().eq('id', req.params.id);
    res.json({ message: 'New customer expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete new customer expense' });
  }
});

// Get all new customer collections (admin and staff can view)
router.get('/collections', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      type = '',
      customerId = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Collections for new customers are stored as invoices
    let query = supabase.from('invoices').select('*', { count: 'exact' });
    
    if (customerId) query = query.eq('customer_id', customerId);
    if (search) query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    
    const sortOrderStr = String(sortOrder).toUpperCase() === 'ASC';
    
    const from = offset;
    const to = offset + limitNum - 1;
    
    const { data, count, error } = await query
      .order(sortBy as string, { ascending: sortOrderStr })
      .range(from, to);

    if (error) throw error;

    res.json({
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get new customer collections error:', error);
    res.status(500).json({ error: 'Failed to fetch new customer collections' });
  }
});

// Get single new customer
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('id', req.params.id)
      .limit(1);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'New customer not found' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Get new customer error:', error);
    res.status(500).json({ error: 'Failed to fetch new customer' });
  }
});

// Update new customer (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const { data, error } = await supabase
      .from('connections')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .limit(1);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'New customer not found' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Update new customer error:', error);
    res.status(500).json({ error: 'Failed to update new customer' });
  }
});

// Delete new customer (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    
    res.json({ message: 'New customer deleted successfully' });
  } catch (error) {
    console.error('Delete new customer error:', error);
    res.status(500).json({ error: 'Failed to delete new customer' });
  }
});

export default router;


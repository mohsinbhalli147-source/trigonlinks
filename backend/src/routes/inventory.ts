import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getSupabaseClient } from '../database/client';

const router = express.Router();
const supabase = getSupabaseClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all inventory (admin and staff can view)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      status = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR category ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Build Supabase query
    let query = supabase.from('inventory').select('*', { count: 'exact' });
    
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('name', `%${search}%`);
    
    const from = offset;
    const to = offset + limitNum - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;

    const formattedData = (data || []).map((item: any) => {
      const qty = Number(item.qty || 0);
      const purchasePrice = Number(item.price || 0);
      const sellingPrice = Number(item.sale_price || 0);
      const currentStockValue = qty * purchasePrice;
      const profitMarginPerUnit = sellingPrice > 0 ? sellingPrice - purchasePrice : 0;

      return {
        ...item,
        brand: item.brand || '',
        unit_type: item.unit_type || 'piece',
        supplier: item.supplier || '',
        current_stock_value: currentStockValue,
        profit_margin_per_unit: profitMarginPerUnit,
      };
    });

    res.json({
      data: formattedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Stock Adjustment route
router.post('/adjust', authorize('admin', 'staff'), [
  body('item_id').notEmpty(),
  body('quantity').isNumeric(),
  body('type').isIn(['in', 'out']),
  body('reason').notEmpty(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const itemId = req.body.item_id;
    const { data: itemResult } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', itemId)
      .limit(1);

    if (!itemResult || itemResult.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = itemResult[0];
    const previousStock = Number(item.qty || 0);
    const adjustQty = Number(req.body.quantity);
    const type = req.body.type as 'in' | 'out';

    if (type === 'out' && adjustQty > previousStock) {
      return res.status(400).json({ error: 'Insufficient stock for this adjustment' });
    }

    const newStock = type === 'in' ? previousStock + adjustQty : previousStock - adjustQty;

    // Update stock
    await supabase
      .from('inventory')
      .update({ 
        qty: newStock, 
        total_purchase_cost: newStock * Number(item.price || 0),
        updated_at: Date.now(), 
        updated_by: req.user?.uid 
      })
      .eq('id', itemId);

    // Record stock transaction
    const transactionData = {
      item_id: itemId,
      item_name: item.name,
      sku: item.sku || '',
      type,
      quantity: adjustQty,
      previous_stock: previousStock,
      new_stock: newStock,
      unit_cost: Number(item.price || 0),
      total_cost: adjustQty * Number(item.price || 0),
      reason: req.body.reason,
      notes: req.body.notes || '',
      performed_by: req.user?.name || req.user?.username || 'System User',
      date: Date.now(),
      created_at: Date.now(),
      created_by: req.user?.uid,
    };

    const { data: txData, error: txError } = await supabase
      .from('inventory_transactions')
      .insert(transactionData)
      .select('*')
      .limit(1);

    if (txError) throw txError;

    // Create Audit Log
    await supabase.from('logs').insert({
      user_id: req.user?.id,
      action: 'INVENTORY_STOCK_ADJUSTMENT',
      details: {
        item_id: itemId,
        item_name: item.name,
        reason: req.body.reason,
        old_value: previousStock,
        new_value: newStock,
        notes: req.body.notes || ''
      },
      timestamp: Date.now()
    });

    res.json(txData![0]);
  } catch (error) {
    console.error('Inventory adjustment error:', error);
    res.status(500).json({ error: 'Failed to perform stock adjustment' });
  }
});

// Create new inventory transaction and update the item quantity
router.post('/transactions', authorize('admin', 'staff'), [
  body('item_id').notEmpty(),
  body('type').isIn(['in', 'out']),
  body('quantity').isNumeric(),
  body('reason').optional().isString(),
  body('notes').optional().isString(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const itemId = req.body.item_id;
    const { data: itemResult } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', itemId)
      .limit(1);

    if (!itemResult || itemResult.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = itemResult[0];
    const currentQuantity = Number(item.qty || 0);
    const transactionQuantity = Number(req.body.quantity);
    const transactionType = req.body.type as 'in' | 'out';

    if (transactionType === 'out' && transactionQuantity > currentQuantity) {
      return res.status(400).json({ error: 'Insufficient stock to perform this transaction' });
    }

    const newQuantity = transactionType === 'in'
      ? currentQuantity + transactionQuantity
      : currentQuantity - transactionQuantity;

    // Update inventory quantity
    await supabase
      .from('inventory')
      .update({ 
        qty: newQuantity, 
        total_purchase_cost: newQuantity * Number(item.price || 0),
        updated_at: Date.now(), 
        updated_by: req.user?.uid 
      })
      .eq('id', itemId);

    // Create transaction record
    const transactionData = {
      item_id: itemId,
      item_name: item.name || item.sku || 'Inventory Item',
      sku: item.sku || '',
      type: transactionType,
      quantity: transactionQuantity,
      previous_stock: currentQuantity,
      new_stock: newQuantity,
      unit_cost: Number(item.price || 0),
      total_cost: transactionQuantity * Number(item.price || 0),
      reason: req.body.reason || '',
      notes: req.body.notes || '',
      performed_by: req.user?.name || req.user?.username || req.user?.uid || 'Unknown',
      date: Date.now(),
      created_at: Date.now(),
      created_by: req.user?.uid,
    };

    const { data: transactionResult, error: insertError } = await supabase
      .from('inventory_transactions')
      .insert(transactionData)
      .select('*')
      .limit(1);

    if (insertError) throw insertError;

    res.json(transactionResult![0]);
  } catch (error) {
    console.error('Create inventory transaction error:', error);
    res.status(500).json({ error: 'Failed to create inventory transaction' });
  }
});

// Get stock transaction history
router.get('/transactions', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { limit = '100', page = '1' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const offset = (pageNum - 1) * limitNum;

    const { data, count, error } = await supabase
      .from('inventory_transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    res.json({
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inventory transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory transactions' });
  }
});

// Get low stock alerts
router.get('/alerts', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('qty', { ascending: true });

    if (error) throw error;

    const lowStockItems = (data || []).filter((item: any) => {
      const qty = Number(item.qty || 0);
      const minLevel = Number(item.min_stock_level || 5);
      return qty <= minLevel;
    });

    res.json({ data: lowStockItems });
  } catch (error) {
    console.error('Get inventory alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory alerts' });
  }
});

// Get single inventory item (admin and staff can view)
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', req.params.id)
      .limit(1);
    
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const item = data[0];
    const qty = Number(item.qty || 0);
    const purchasePrice = Number(item.price || 0);
    const sellingPrice = Number(item.sale_price || 0);

    res.json({
      ...item,
      brand: item.brand || '',
      unit_type: item.unit_type || 'piece',
      supplier: item.supplier || '',
      current_stock_value: qty * purchasePrice,
      profit_margin_per_unit: sellingPrice > 0 ? sellingPrice - purchasePrice : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create inventory item (admin only)
router.post('/', authorize('admin'), [
  body('name').notEmpty(),
  body('category').notEmpty(),
  body('qty').isNumeric(),
  body('price').isNumeric(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const qty = Number(req.body.qty);
    const price = Number(req.body.price);

    const inventoryData = {
      name: req.body.name,
      sku: req.body.sku,
      category: req.body.category,
      brand: req.body.brand || '',
      unit_type: req.body.unit_type || 'piece',
      supplier: req.body.supplier || '',
      qty,
      price,
      sale_price: req.body.sale_price ? Number(req.body.sale_price) : null,
      total_purchase_cost: qty * price,
      min_stock_level: req.body.min_stock_level ? Number(req.body.min_stock_level) : 10,
      monthly_usage: req.body.monthly_usage ? Number(req.body.monthly_usage) : 0,
      location: req.body.location,
      warehouse: req.body.warehouse,
      status: req.body.status || 'active',
      last_restocked: req.body.last_restocked || Date.now(),
      created_at: Date.now(),
      created_by: req.user?.uid,
    };

    const { data: result, error: insertError } = await supabase
      .from('inventory')
      .insert(inventoryData)
      .select('*')
      .limit(1);

    if (insertError) throw insertError;

    // Record audit log
    await supabase.from('logs').insert({
      user_id: req.user?.id,
      action: 'INVENTORY_ITEM_CREATED',
      details: { item_name: req.body.name, qty, price },
      timestamp: Date.now()
    });

    res.json(result![0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { data: existing } = await supabase.from('inventory').select('*').eq('id', req.params.id).single();

    const newQty = req.body.qty !== undefined ? Number(req.body.qty) : existing?.qty;
    const newPrice = req.body.price !== undefined ? Number(req.body.price) : existing?.price;

    const updateData: any = {
      name: req.body.name,
      sku: req.body.sku,
      category: req.body.category,
      brand: req.body.brand,
      unit_type: req.body.unit_type,
      supplier: req.body.supplier,
      qty: newQty,
      price: newPrice,
      sale_price: req.body.sale_price !== undefined ? Number(req.body.sale_price) : undefined,
      total_purchase_cost: newQty * newPrice,
      min_stock_level: req.body.min_stock_level !== undefined ? Number(req.body.min_stock_level) : undefined,
      monthly_usage: req.body.monthly_usage !== undefined ? Number(req.body.monthly_usage) : undefined,
      location: req.body.location,
      warehouse: req.body.warehouse,
      status: req.body.status,
      last_restocked: req.body.last_restocked,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };

    const { data: result, error: updateError } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .limit(1);
    
    if (updateError) throw updateError;
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Record audit log for price or stock changes
    await supabase.from('logs').insert({
      user_id: req.user?.id,
      action: 'INVENTORY_ITEM_UPDATED',
      details: { 
        id: req.params.id, 
        old_value: { qty: existing?.qty, price: existing?.price, sale_price: existing?.sale_price },
        new_value: { qty: newQty, price: newPrice, sale_price: updateData.sale_price }
      },
      timestamp: Date.now()
    });

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('inventory').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

export default router;



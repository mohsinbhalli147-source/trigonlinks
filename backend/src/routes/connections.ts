import express from 'express';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { ConnectionsRepository } from '../repositories/ConnectionsRepository';
import { cache } from '../utils/cache';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { getSupabaseClient } from '../database/client';
import { createNotification } from '../services/notifications';
import crypto from 'crypto';

const router = express.Router();
const connectionsRepo = new ConnectionsRepository();
const customersRepo = new CustomersRepository();
const supabase = getSupabaseClient();

// Helper to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
};

// Helper to convert only the data array in paginated results
const convertPaginatedResponse = (response: any): any => {
  if (response && response.data && Array.isArray(response.data)) {
    return {
      ...response,
      data: response.data.map(toCamelCase)
    };
  }
  return toCamelCase(response);
};

// Apply authentication to all routes
router.use(authenticate);

// Get all connections (admin and staff can view)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
      area = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await connectionsRepo.paginateConnections({
      page: pageNum,
      limit: limitNum,
      status: status as any,
      area: area as string,
      search: search as string,
    });

    res.json(convertPaginatedResponse(result));
  } catch (error) {
    logger.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Get single connection (admin and staff can view)
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const connection = await connectionsRepo.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Fetch expenses from the relational table
    const { data: expenses, error: expError } = await supabase
      .from('connection_expenses')
      .select('*')
      .eq('connection_id', req.params.id)
      .order('created_at', { ascending: true });

    if (expError) {
      logger.error('Failed to fetch connection expenses:', expError);
    }

    // Map expenses to legacy format for frontend compatibility
    const mappedExpenses = (expenses || []).map((exp: any) => ({
      amount: exp.total_cost,
      category: exp.title,
      description: exp.description,
      inventoryItems: exp.notes,
      id: exp.id,
      vendor: exp.vendor,
      quantity: exp.quantity,
      unit_cost: exp.unit_cost,
    }));

    res.json({ ...toCamelCase(connection), expenses: mappedExpenses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connection' });
  }
});

// Create connection request (admin only)
router.post('/', authorize('admin'), [
  body('name').notEmpty(),
  body('phone').notEmpty(),
  body('package').notEmpty(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      name, 
      fatherName, 
      phone, 
      cnic, 
      address, 
      area, 
      package: pkg, 
      installationDate, 
      billingDate, 
      connectionFee, 
      monthlyFee, 
      concession, 
      concessionReason, 
      expenses, 
      notes, 
      status 
    } = req.body;
    
    // Check for duplicate phone number from customers table
    const existingByPhone = await customersRepo.findByMobile(phone);
    if (existingByPhone) {
      return res.status(409).json({ error: 'A customer with this phone number already exists' });
    }
    
    // Check for duplicate CNIC from customers table
    if (cnic) {
      const existingByCnic = await customersRepo.findMany({ cnic });
      if (existingByCnic.length > 0) {
        return res.status(409).json({ error: 'A customer with this CNIC already exists' });
      }
    }
    
    const uid = crypto.randomUUID();

    // 1. Create the customer (Status inactive until approved)
    const customerData = {
      uid,
      name,
      father_name: fatherName,
      mobile: phone,
      cnic,
      address,
      area,
      package: pkg,
      fee: Number(monthlyFee) || 0,
      install_date: installationDate ? new Date(installationDate).getTime() : Date.now(),
      billing_date: billingDate ? Number(billingDate) : undefined,
      install_fee: Number(connectionFee) || 0,
      status: 'inactive' as const, 
      notes: notes,
      iptv_enabled: false,
      iptv_monthly_charges: 0,
      live_ip_enabled: false,
      live_ip_monthly_fee: 0,
      created_at: Date.now(),
      created_by: req.user?.uid,
    };

    const newCustomer = await customersRepo.createCustomer(customerData);

    // 2. Create the connection linked to the customer
    const connectionData = {
      customer_id: newCustomer.id,
      customer_name: name,
      father_name: fatherName,
      phone,
      cnic,
      address,
      area,
      package: pkg,
      installation_date: installationDate ? new Date(installationDate).getTime() : null,
      billing_date: billingDate,
      connection_fee: Number(connectionFee) || 0,
      monthly_fee: Number(monthlyFee) || 0,
      concession: Number(concession) || 0,
      concession_reason: concessionReason,
      notes,
      status: status || 'pending',
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const connection = await connectionsRepo.createConnection(connectionData);

    // 3. Save expenses to connection_expenses table
    if (expenses && Array.isArray(expenses) && expenses.length > 0) {
      const expensesToInsert = expenses.map((exp: any) => ({
        connection_id: connection.id,
        title: exp.category || 'Connection Expense',
        description: exp.description || '',
        quantity: exp.inventoryItems ? 1 : 1,
        unit_cost: Number(exp.amount) || 0,
        total_cost: Number(exp.amount) || 0,
        notes: exp.inventoryItems || '',
        created_at: new Date().toISOString()
      }));

      const { error: expError } = await supabase.from('connection_expenses').insert(expensesToInsert);
      if (expError) {
        logger.error('Failed to save connection expenses:', expError);
      }
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(toCamelCase(connection));
  } catch (error) {
    logger.error('Create connection error:', error);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

// Update connection (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    // 1. Fetch existing connection to see previous status
    const existingConnection = await connectionsRepo.findById(req.params.id);
    if (!existingConnection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const { status: oldStatus, customer_id: customerId } = existingConnection;
    const newStatus = req.body.status || oldStatus;

    // Create notification for customer when connection status changes
    if (oldStatus !== newStatus && customerId) {
      const customer = await customersRepo.findById(customerId);
      if (customer && customer.uid) {
        const user = await supabase.from('users').select('id').eq('uid', customer.uid).limit(1).single();
        if (user.data) {
          let title = 'Connection Status Updated';
          let message = `Your connection status has been updated to: ${newStatus}`;
          let type: 'info' | 'success' | 'warning' | 'error' = 'info';

          switch (newStatus) {
            case 'approved':
              title = 'Connection Approved';
              message = 'Your connection request has been approved. Installation will be scheduled soon.';
              type = 'success';
              break;
            case 'rejected':
              title = 'Connection Rejected';
              message = 'Your connection request has been rejected. Please contact support for more information.';
              type = 'error';
              break;
            case 'completed':
              title = 'Connection Completed';
              message = 'Your internet connection has been successfully installed. You can now enjoy our services.';
              type = 'success';
              break;
            case 'in-progress':
              title = 'Installation In Progress';
              message = 'Your connection installation is currently in progress.';
              type = 'info';
              break;
            case 'on-hold':
              title = 'Service Suspended';
              message = 'Your internet service has been suspended. Please contact support for details.';
              type = 'warning';
              break;
            case 'inactive':
              title = 'Service Suspended';
              message = 'Your internet service has been suspended. Please contact support for details.';
              type = 'warning';
              break;
            case 'active':
              if (oldStatus === 'on-hold' || oldStatus === 'inactive') {
                title = 'Service Restored';
                message = 'Your internet service has been restored. You can now use our services.';
                type = 'success';
              }
              break;
          }

          await createNotification({
            user_id: user.data.id,
            type: 'connection',
            title,
            message,
            action_url: '/connections',
            action_text: 'View Connection',
            related_id: req.params.id,
            related_type: 'connection',
            is_read: false,
            expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000),
          });
        }
      }
    }

    // Map camelCase to snake_case for database
    const updateData: any = {
      customer_name: req.body.name || req.body.customer_name,
      father_name: req.body.fatherName || req.body.father_name,
      phone: req.body.phone,
      cnic: req.body.cnic,
      address: req.body.address,
      package: req.body.package,
      area: req.body.area,
      status: newStatus,
      assigned_staff: req.body.assigned_staff,
      technician_id: req.body.technician_id,
      installation_date: req.body.installationDate ? new Date(req.body.installationDate).getTime() : req.body.installation_date,
      billing_date: req.body.billingDate || req.body.billing_date,
      connection_fee: req.body.connectionFee !== undefined ? Number(req.body.connectionFee) : req.body.connection_fee,
      monthly_fee: req.body.monthlyFee !== undefined ? Number(req.body.monthlyFee) : req.body.monthly_fee,
      concession: req.body.concession !== undefined ? Number(req.body.concession) : req.body.concession,
      concession_reason: req.body.concessionReason || req.body.concession_reason,
      notes: req.body.notes,
      rejection_reason: req.body.rejectionReason || req.body.rejection_reason,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const connection = await connectionsRepo.updateConnection(req.params.id, updateData);
    
    // 2. Handle Expenses sync if provided
    if (req.body.expenses && Array.isArray(req.body.expenses)) {
      // Clear old expenses
      await supabase.from('connection_expenses').delete().eq('connection_id', req.params.id);
      
      // Insert new expenses
      if (req.body.expenses.length > 0) {
        const expensesToInsert = req.body.expenses.map((exp: any) => ({
          connection_id: req.params.id,
          title: exp.category || 'Connection Expense',
          description: exp.description || '',
          quantity: exp.inventoryItems ? 1 : 1,
          unit_cost: Number(exp.amount) || 0,
          total_cost: Number(exp.amount) || 0,
          notes: exp.inventoryItems || '',
          created_at: new Date().toISOString()
        }));
        await supabase.from('connection_expenses').insert(expensesToInsert);
      }
    }

    // 3. Approval Workflow (Transition from pending -> approved or completed)
    if ((newStatus === 'approved' || newStatus === 'completed' || newStatus === 'in-progress') && oldStatus === 'pending') {
      if (customerId) {
        // Activate Customer
        await customersRepo.updateCustomer(customerId, {
          status: 'active',
          updated_at: Date.now()
        });

        const connectionFeeAmt = Number(updateData.connection_fee) || Number(existingConnection.connection_fee) || 0;
        const nowMs = Date.now();
        const invoiceDate = new Date(nowMs);
        const invoiceNumber = `CN-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth()+1).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        // A) Create dedicated Connection Fee Invoice
        if (connectionFeeAmt > 0) {
          const invoiceData = {
            invoice_number: invoiceNumber,
            customer_id: customerId,
            customer_name: updateData.customer_name || existingConnection.customer_name,
            package: updateData.package || existingConnection.package || 'Standard',
            amount: connectionFeeAmt,
            paid_amount: connectionFeeAmt,
            remaining_balance: 0,
            discount_amount: 0,
            status: 'paid',
            type: 'connection_fee',
            due_date: nowMs,
            last_payment_date: nowMs,
            last_payment_amount: connectionFeeAmt,
            created_at: nowMs,
            created_by: req.user?.uid
          };
          
          const { data: invResult, error: invoiceError } = await supabase
            .from('invoices')
            .insert(invoiceData)
            .select('id')
            .single();

          if (invoiceError) {
            logger.error('Failed to create Connection Fee invoice on approval:', invoiceError);
          } else if (invResult) {
            // B) Auto-create Payment Record
            await supabase.from('payments').insert({
              customer_id: customerId,
              customer_name: updateData.customer_name || existingConnection.customer_name,
              invoice_id: invResult.id,
              amount: connectionFeeAmt,
              payment_method: req.body.paymentMethod || 'Cash',
              status: 'completed',
              approval_status: 'approved',
              notes: 'Automatic payment recorded on Connection Approval',
              approved_at: nowMs,
              approved_by: req.user?.id,
              created_at: nowMs,
              created_by: req.user?.uid
            });
          }
        }

        // C) Inventory Usage & Cost Calculation (Cost Price vs Selling Price)
        let totalCostExpense = 0;
        const usedItems = req.body.usedItems || req.body.used_items;

        if (usedItems && Array.isArray(usedItems) && usedItems.length > 0) {
          for (const itemUsage of usedItems) {
            const itemId = itemUsage.itemId || itemUsage.item_id;
            const qty = Number(itemUsage.quantity || 0);

            if (itemId && qty > 0) {
              const { data: invItems } = await supabase.from('inventory').select('*').eq('id', itemId).limit(1);
              if (invItems && invItems.length > 0) {
                const invItem = invItems[0];
                const unitCost = Number(invItem.price || 0); // Cost Price
                const sellingPrice = Number(invItem.sale_price || unitCost); // Selling Price
                const itemTotalCost = qty * unitCost;
                const itemTotalValue = qty * sellingPrice;

                totalCostExpense += itemTotalCost;

                const previousStock = Number(invItem.qty || 0);
                const newStock = Math.max(0, previousStock - qty);

                // 1. Deduct Stock
                await supabase.from('inventory').update({
                  qty: newStock,
                  total_purchase_cost: newStock * unitCost,
                  updated_at: nowMs,
                  updated_by: req.user?.uid
                }).eq('id', itemId);

                // 2. Record Stock Transaction (CUSTOMER_USAGE)
                await supabase.from('inventory_transactions').insert({
                  item_id: itemId,
                  item_name: invItem.name,
                  sku: invItem.sku || '',
                  type: 'out',
                  quantity: qty,
                  previous_stock: previousStock,
                  new_stock: newStock,
                  unit_cost: unitCost,
                  total_cost: itemTotalCost,
                  reason: 'CUSTOMER_USAGE',
                  reference_id: req.params.id,
                  notes: `Used in Connection ${req.params.id} for Customer ${updateData.customer_name || existingConnection.customer_name}`,
                  performed_by: req.user?.name || req.user?.username || 'System',
                  date: nowMs,
                  created_at: nowMs,
                  created_by: req.user?.uid
                });

                // 3. Insert into connection_used_items
                await supabase.from('connection_used_items').insert({
                  connection_id: req.params.id,
                  customer_id: customerId,
                  item_id: itemId,
                  item_name: invItem.name,
                  quantity: qty,
                  unit_cost: unitCost,
                  selling_price: sellingPrice,
                  total_cost: itemTotalCost,
                  total_value: itemTotalValue,
                  created_at: nowMs,
                  created_by: req.user?.uid
                });
              }
            }
          }
        }

        // D) Inject Installation Expense into Main Ledger (using COST PRICE)
        if (totalCostExpense > 0) {
          // Ensure category 'Installation' exists or insert
          const { data: catData } = await supabase.from('expense_categories').select('name').eq('name', 'Installation').limit(1);
          if (!catData || catData.length === 0) {
            await supabase.from('expense_categories').insert({
              name: 'Installation',
              description: 'Connection Installation Expenses',
              created_at: nowMs
            });
          }

          await supabase.from('expenses').insert({
            name: `Installation Expense - ${updateData.customer_name || existingConnection.customer_name}`,
            title: `Connection Installation - ${req.params.id}`,
            category: 'Installation',
            amount: totalCostExpense,
            date: nowMs,
            description: `Auto-generated installation expense using inventory cost price for connection ${req.params.id}`,
            area: updateData.area || existingConnection.area,
            reference_type: 'NEW_CONNECTION',
            reference_id: req.params.id,
            created_at: nowMs,
            created_by: req.user?.uid
          });
        }

        // E) Create Audit Log
        await supabase.from('logs').insert({
          user_id: req.user?.id,
          action: 'CONNECTION_APPROVED',
          details: {
            connection_id: req.params.id,
            customer_id: customerId,
            connection_fee: connectionFeeAmt,
            total_installation_cost: totalCostExpense
          },
          timestamp: nowMs
        });
      }
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json(toCamelCase(connection));
  } catch (error) {
    logger.error('Update connection error:', error);
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

// Delete connection (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await connectionsRepo.deleteConnection(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

export default router;


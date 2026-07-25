import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { cache } from '../utils/cache';
import { googleContactsService } from '../services/google-contacts';
import { getSupabaseClient } from '../database/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { convertObjectKeysToSnake, convertObjectKeysToCamel } from '../utils/fieldConverter';

const router = express.Router();
const customersRepo = new CustomersRepository();
const supabase = getSupabaseClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all customers (admin and staff can view)
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

    const result = await customersRepo.paginateCustomers({
      page: pageNum,
      limit: limitNum,
      status: status as any,
      area: area as string,
      search: search as string,
    });

    // Convert snake_case to camelCase for frontend
    const convertedResult = {
      ...result,
      data: result.data.map(customer => convertObjectKeysToCamel(customer))
    };

    res.json(convertedResult);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Search customers
router.get('/search', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { q = '' } = req.query;
    
    const result = await customersRepo.paginateCustomers({
      page: 1,
      limit: 20,
      search: q as string,
    });

    res.json(result);
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Get single customer
router.get('/:id', authorize('admin', 'staff', 'customer'), async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'customer' && req.user?.uid !== req.params.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Try to find by database ID first, then by UID
    let customer = await customersRepo.findById(req.params.id);
    if (!customer) {
      customer = await customersRepo.findByUid(req.params.id);
    }
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Convert snake_case to camelCase for frontend
    const customerCamel = convertObjectKeysToCamel(customer);
    res.json(customerCamel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer (admin only)
router.post('/', authorize('admin'), [
  body('name').notEmpty(),
  body('mobile').notEmpty(),
  body('fee').isNumeric(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Convert camelCase to snake_case for database
    const customerDataSnake = convertObjectKeysToSnake(req.body) as any;
    const customerData: any = {
      uid: customerDataSnake.uid || crypto.randomUUID(),
      name: customerDataSnake.name,
      mobile: customerDataSnake.mobile,
      address: customerDataSnake.address,
      area: customerDataSnake.area,
      status: customerDataSnake.status || 'active',
      package: customerDataSnake.package,
      fee: Number(customerDataSnake.fee),
      install_date: customerDataSnake.install_date,
      iptv_enabled: customerDataSnake.iptv_enabled || false,
      live_ip_enabled: customerDataSnake.live_ip_enabled || false,
      iptv_monthly_charges: customerDataSnake.iptv_monthly_charges || 0,
      live_ip_monthly_fee: customerDataSnake.live_ip_monthly_fee || 0,
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const customer = await customersRepo.createCustomer(customerData);
    
    // Convert back to camelCase for frontend response
    const customerCamel = convertObjectKeysToCamel(customer);
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    // Async sync to Google Contacts (don't await)
    if (req.user?.uid) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('uid', req.user.uid)
        .limit(1)
        .single();
      
      if (userData && customer.id) {
        // Convert customer to proper format for Google sync
        const customerForSync: any = {
          id: parseInt(customer.id as string),
          uid: customer.uid,
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          area: customer.area,
          package: customer.package,
          status: customer.status,
          install_date: customer.install_date,
          billing_date: (customer as any).billing_date,
          fee: customer.fee
        };
        // Add optional fields if they exist
        if ((customer as any).father_name) customerForSync.fatherName = (customer as any).father_name;
        if ((customer as any).username) customerForSync.username = (customer as any).username;
        if ((customer as any).email) customerForSync.email = (customer as any).email;
        if ((customer as any).notes) customerForSync.notes = (customer as any).notes;
        
        googleContactsService.createContact(userData.id, customerForSync).catch(err => {
          logger.error('Failed to sync new customer to Google Contacts:', err);
        });
      }
    }
    
    res.json(customerCamel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    console.log('Update customer request:', req.params.id, req.body);
    
    // Convert camelCase to snake_case for database
    const updateDataSnake = convertObjectKeysToSnake(req.body) as any;
    const updateData: any = {
      ...updateDataSnake,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    console.log('Converted update data for database:', updateData);
    
    const customer = await customersRepo.updateCustomer(req.params.id, updateData);
    if (!customer) {
      console.error('Customer not found:', req.params.id);
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    console.log('Customer updated successfully:', customer.id);
    
    // Convert back to camelCase for frontend response
    const customerCamel = convertObjectKeysToCamel(customer);
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    // Async sync to Google Contacts (don't await)
    if (req.user?.uid) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('uid', req.user.uid)
        .limit(1)
        .single();
      
      if (userData && customer.id) {
        // Get sync status
        const syncStatus = await googleContactsService.getSyncStatus(parseInt(customer.id as string));
        
        if (syncStatus.synced && syncStatus.googleContactId) {
          // Update existing contact
          const customerForSync: any = {
            id: parseInt(customer.id as string),
            uid: customer.uid,
            name: customer.name,
            mobile: customer.mobile,
            address: customer.address,
            area: customer.area,
            package: customer.package,
            status: customer.status,
            install_date: customer.install_date,
            billing_date: (customer as any).billing_date,
            fee: customer.fee
          };
          if ((customer as any).father_name) customerForSync.fatherName = (customer as any).father_name;
          if ((customer as any).username) customerForSync.username = (customer as any).username;
          if ((customer as any).email) customerForSync.email = (customer as any).email;
          if ((customer as any).notes) customerForSync.notes = (customer as any).notes;
          
          googleContactsService.updateContact(userData.id, customerForSync, syncStatus.googleContactId).catch(err => {
            logger.error('Failed to sync updated customer to Google Contacts:', err);
          });
        }
      }
    }
    
    res.json(customerCamel);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer (admin only)
router.delete('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    // Get sync status before deletion
    const syncStatus = await googleContactsService.getSyncStatus(parseInt(req.params.id));
    
    const deleted = await customersRepo.deleteCustomer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Invalidate dashboard cache
    cache.deletePattern(/^dashboard:/);
    
    // Async archive Google Contact (don't await)
    if (req.user?.uid && syncStatus.synced && syncStatus.googleContactId) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('uid', req.user.uid)
        .limit(1)
        .single();
      
      if (userData) {
        googleContactsService.deleteContact(userData.id, syncStatus.googleContactId).catch(err => {
          logger.error('Failed to archive Google Contact:', err);
        });
      }
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;


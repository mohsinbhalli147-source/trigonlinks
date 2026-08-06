import { query, getClient, transaction } from '../database/client';
import { logger } from '../utils/logger';

/**
 * Application-layer trigger logic
 * Replaces database triggers that were removed for CockroachDB compatibility
 */

// Invoice number generation (replaces trg_set_invoice_number trigger)
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    const datePart = new Date().toISOString().slice(0, 7).replace(/-/g, '');
    
    const result = await query(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1 as seq_part
       FROM invoices
       WHERE invoice_number LIKE $1`,
      [`INV-${datePart}-%`]
    );
    
    const seqPart = result.rows[0].seq_part;
    const invoiceNum = `INV-${datePart}-${String(seqPart).padStart(4, '0')}`;
    
    return invoiceNum;
  } catch (error) {
    logger.error('Failed to generate invoice number:', error);
    throw error;
  }
};

// Update expense category spent amount (replaces trg_update_expense_category_spent trigger)
export const updateExpenseCategorySpent = async (
  categoryName: string, 
  amount: number, 
  operation: 'insert' | 'update' | 'delete'
): Promise<void> => {
  try {
    if (operation === 'insert') {
      await query(
        'UPDATE expense_categories SET spent = spent + $1 WHERE name = $2',
        [amount, categoryName]
      );
    } else if (operation === 'update') {
      // This will be called with net change in amount
      await query(
        'UPDATE expense_categories SET spent = spent + $1 WHERE name = $2',
        [amount, categoryName]
      );
    } else if (operation === 'delete') {
      await query(
        'UPDATE expense_categories SET spent = spent - $1 WHERE name = $2',
        [amount, categoryName]
      );
    }
    
    logger.info(`Updated expense category ${categoryName} spent amount`);
  } catch (error) {
    logger.error('Failed to update expense category spent:', error);
    throw error;
  }
};

// Update inventory quantity (replaces trg_update_inventory_quantity trigger)
export const updateInventoryQuantity = async (
  itemId: string, 
  quantity: number, 
  type: 'in' | 'out'
): Promise<void> => {
  try {
    const currentTime = Date.now();
    
    if (type === 'in') {
      await query(
        'UPDATE inventory SET qty = qty + $1, updated_at = $2 WHERE id = $3',
        [quantity, currentTime, itemId]
      );
    } else if (type === 'out') {
      await query(
        'UPDATE inventory SET qty = qty - $1, updated_at = $2 WHERE id = $3',
        [quantity, currentTime, itemId]
      );
    }
    
    logger.info(`Updated inventory item ${itemId} quantity`);
  } catch (error) {
    logger.error('Failed to update inventory quantity:', error);
    throw error;
  }
};

// Cleanup expired notifications (replaces scheduled cleanup)
export const cleanupExpiredNotifications = async (): Promise<number> => {
  try {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const result = await query(
      'DELETE FROM notifications WHERE created_at < $1',
      [thirtyDaysAgo]
    );
    
    const deletedCount = result.rowCount || 0;
    logger.info(`Cleaned up ${deletedCount} expired notifications`);
    
    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup expired notifications:', error);
    throw error;
  }
};

// Mark overdue invoices (replaces scheduled task)
export const markOverdueInvoices = async (): Promise<number> => {
  try {
    const currentTime = Date.now();
    
    const result = await query(
      `UPDATE invoices 
       SET status = 'overdue', updated_at = $1 
       WHERE status = 'unpaid' AND due_date < $2`,
      [currentTime, currentTime]
    );
    
    const updatedCount = result.rowCount || 0;
    logger.info(`Marked ${updatedCount} invoices as overdue`);
    
    return updatedCount;
  } catch (error) {
    logger.error('Failed to mark overdue invoices:', error);
    throw error;
  }
};

// Helper function to get customer summary with parameters (replaces SECURITY DEFINER function)
export const getCustomerSummary = async (userId: string, userRole: string): Promise<any[]> => {
  try {
    // Get user uid from user_id
    const userResult = await query('SELECT uid FROM users WHERE id = $1', [userId]);
    const userUid = userResult.rows[0]?.uid;
    
    const result = await query(
      `SELECT 
        c.id,
        c.uid,
        c.name,
        c.mobile,
        c.area,
        c.status,
        c.package,
        c.fee,
        COUNT(DISTINCT i.id) as total_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as paid_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'unpaid' THEN i.id END) as unpaid_invoices,
        COALESCE(SUM(i.remaining_balance), 0) as outstanding_balance,
        COALESCE(SUM(i.paid_amount), 0) as total_paid
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id
      WHERE (
        $1 = 'admin'
        OR $1 = 'staff'
        OR c.uid = $2
      )
      GROUP BY c.id`,
      [userRole, userUid]
    );
    
    return result.rows;
  } catch (error) {
    logger.error('Failed to get customer summary:', error);
    throw error;
  }
};

// Helper function to get area summary with parameters (replaces SECURITY DEFINER function)
export const getAreaSummary = async (userRole: string): Promise<any[]> => {
  try {
    // Only admins and staff can view area summaries
    if (userRole !== 'admin' && userRole !== 'staff') {
      return [];
    }
    
    const result = await query(
      `SELECT 
        a.id,
        a.name,
        a.status,
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_customers,
        COALESCE(SUM(c.fee), 0) as monthly_revenue,
        COUNT(DISTINCT conn.id) as total_connections,
        COUNT(DISTINCT CASE WHEN conn.status = 'approved' THEN conn.id END) as approved_connections
      FROM areas a
      LEFT JOIN customers c ON a.name = c.area
      LEFT JOIN connections conn ON a.name = conn.area
      GROUP BY a.id`
    );
    
    return result.rows;
  } catch (error) {
    logger.error('Failed to get area summary:', error);
    throw error;
  }
};

// Helper function to get staff performance with parameters (replaces SECURITY DEFINER function)
export const getStaffPerformance = async (userId: string, userRole: string): Promise<any[]> => {
  try {
    // Only admins and staff can view staff performance
    if (userRole !== 'admin' && userRole !== 'staff') {
      return [];
    }
    
    // Get user uid from user_id
    const userResult = await query('SELECT uid FROM users WHERE id = $1', [userId]);
    const userUid = userResult.rows[0]?.uid;
    
    const result = await query(
      `SELECT 
        s.id,
        s.name,
        s.role,
        s.status,
        s.assigned_area,
        COUNT(DISTINCT CASE WHEN conn.status = 'approved' THEN conn.id END) as total_connections,
        COALESCE(SUM(p.amount), 0) as total_collections,
        COUNT(DISTINCT p.id) as total_payments
      FROM staff s
      LEFT JOIN connections conn ON s.id = conn.assigned_staff
      LEFT JOIN payments p ON s.id = p.collected_by
      WHERE (
        $1 = 'admin'
        OR s.uid = $2
      )
      GROUP BY s.id`,
      [userRole, userUid]
    );
    
    return result.rows;
  } catch (error) {
    logger.error('Failed to get staff performance:', error);
    throw error;
  }
};

export default {
  generateInvoiceNumber,
  updateExpenseCategorySpent,
  updateInventoryQuantity,
  cleanupExpiredNotifications,
  markOverdueInvoices,
  getCustomerSummary,
  getAreaSummary,
  getStaffPerformance
};
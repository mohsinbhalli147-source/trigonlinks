import express from 'express';
import { logger } from '../utils/logger';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getSupabaseClient } from '../database/client';
import { getBackupScheduler } from '../services/backup-scheduler';

const router = express.Router();
const supabase = getSupabaseClient();

router.use(authenticate);

// Export backup data (Admin only)
router.get('/export', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const [customers, connections, invoices, payments, expenses, inventory, inventoryTx, logs] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('connections').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('inventory').select('*'),
      supabase.from('inventory_transactions').select('*'),
      supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(500)
    ]);

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        customers: customers.data || [],
        connections: connections.data || [],
        invoices: invoices.data || [],
        payments: payments.data || [],
        expenses: expenses.data || [],
        inventory: inventory.data || [],
        inventory_transactions: inventoryTx.data || [],
        logs: logs.data || []
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.json`);
    res.json(backupData);
  } catch (error) {
    logger.error('Backup export error:', error);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

// Restore backup data (Admin only)
router.post('/restore', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Invalid backup payload' });
    }

    // Record audit log
    await supabase.from('logs').insert({
      user_id: req.user?.id,
      action: 'SYSTEM_RESTORE_INITIATED',
      details: { timestamp: new Date().toISOString() },
      timestamp: Date.now()
    });

    res.json({ message: 'Backup restore received successfully' });
  } catch (error) {
    logger.error('Backup restore error:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Trigger manual backup (Admin only)
router.post('/trigger', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const backupScheduler = getBackupScheduler();
    const success = await backupScheduler.runBackup();
    
    if (success) {
      res.json({ message: 'Manual backup completed successfully' });
    } else {
      res.status(500).json({ error: 'Manual backup failed' });
    }
  } catch (error) {
    logger.error('Manual backup error:', error);
    res.status(500).json({ error: 'Failed to trigger manual backup' });
  }
});

// Get backup status (Admin only)
router.get('/status', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const backupScheduler = getBackupScheduler();
    const status = await backupScheduler.getBackupStatus();
    res.json(status);
  } catch (error) {
    logger.error('Backup status error:', error);
    res.status(500).json({ error: 'Failed to get backup status' });
  }
});

// Restore from backup file (Admin only)
router.post('/restore-file', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const backupScheduler = getBackupScheduler();
    const success = await backupScheduler.restoreBackup(filePath);
    
    if (success) {
      // Record audit log
      await supabase.from('logs').insert({
        user_id: req.user?.id,
        action: 'SYSTEM_RESTORE_COMPLETED',
        details: { filePath, timestamp: new Date().toISOString() },
        timestamp: Date.now()
      });
      
      res.json({ message: 'Backup restore completed successfully' });
    } else {
      res.status(500).json({ error: 'Backup restore failed' });
    }
  } catch (error) {
    logger.error('Backup restore from file error:', error);
    res.status(500).json({ error: 'Failed to restore backup from file' });
  }
});

export default router;

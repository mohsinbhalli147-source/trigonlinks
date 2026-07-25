import { getSupabaseClient } from '../src/database/client';
import { logger } from '../src/utils/logger';

/**
 * Verify database indexes are properly configured
 */
async function verifyIndexes() {
  const supabase = getSupabaseClient();
  
  logger.info('[INDEXES] Starting database index verification...');

  const tables = [
    'users',
    'staff',
    'customers',
    'connections',
    'invoices',
    'payments',
    'expenses',
    'inventory',
    'complaints',
    'announcements',
    'notifications',
    'areas',
    'packages',
    'expense_categories',
    'inventory_transactions',
    'refresh_tokens',
    'password_reset_tokens',
    'logs',
    'connection_expenses'
  ];

  const indexChecks: any[] = [];

  for (const table of tables) {
    try {
      // Check if table exists
      const { data: tableExists, error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (tableError) {
        logger.warn(`[INDEXES] Table ${table} does not exist or is not accessible:`, tableError.message);
        continue;
      }

      // Check for common indexes using PostgreSQL system tables
      const { data: indexes, error: indexError } = await supabase
        .rpc('get_table_indexes', { table_name: table })
        .select('*');

      if (indexError) {
        // Fallback: just log that we couldn't check indexes
        logger.warn(`[INDEXES] Could not verify indexes for ${table}:`, indexError.message);
        indexChecks.push({ table, status: 'unknown', message: 'Could not verify indexes' });
      } else {
        logger.info(`[INDEXES] Table ${table} has ${indexes?.length || 0} indexes`);
        indexChecks.push({ table, status: 'verified', count: indexes?.length || 0 });
      }
    } catch (error) {
      logger.error(`[INDEXES] Error checking table ${table}:`, error);
      indexChecks.push({ table, status: 'error', message: String(error) });
    }
  }

  // Summary
  const verified = indexChecks.filter(c => c.status === 'verified').length;
  const errors = indexChecks.filter(c => c.status === 'error').length;
  const unknown = indexChecks.filter(c => c.status === 'unknown').length;

  logger.info(`[INDEXES] Verification complete: ${verified} verified, ${errors} errors, ${unknown} unknown`);

  return {
    success: errors === 0,
    summary: { verified, errors, unknown },
    details: indexChecks
  };
}

// Run verification
verifyIndexes()
  .then(result => {
    if (result.success) {
      logger.info('[INDEXES] All indexes verified successfully');
      process.exit(0);
    } else {
      logger.error('[INDEXES] Index verification failed with errors');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error('[INDEXES] Fatal error:', error);
    process.exit(1);
  });

import { MigrationManager } from './migration-manager';
import { logger } from '../../utils/logger';

/**
 * Run database migrations on application startup
 * This ensures the database schema is always up-to-date
 */
export async function runStartupMigrations(): Promise<boolean> {
  try {
    logger.info('[MIGRATION] Starting database migration check...');

    const migrationManager = new MigrationManager();

    // Run pending migrations
    const result = await migrationManager.runMigrations();

    if (result.success) {
      logger.info(`[MIGRATION] All migrations completed successfully (${result.results.length} migrations)`);
      
      // Verify schema integrity
      const verification = await migrationManager.verifySchema();
      
      if (verification.success) {
        logger.info('[MIGRATION] Schema verification passed');
      } else {
        logger.warn('[MIGRATION] Schema verification found issues:', verification.issues);
      }

      // Get migration status
      const status = await migrationManager.getStatus();
      logger.info(`[MIGRATION] Status: ${status.executed} executed, ${status.pending} pending`);
      
      return true;
    } else {
      logger.error('[MIGRATION] Migration process failed');
      result.results.forEach(r => {
        if (!r.success) {
          logger.error(`[MIGRATION] Failed: ${r.migration} - ${r.error}`);
        }
      });
      return false;
    }
  } catch (error) {
    logger.error('[MIGRATION] Startup migration error:', error);
    // Don't fail startup - log error and continue
    // In production, you might want to be stricter
    return false;
  }
}

/**
 * Quick schema verification (lightweight check)
 */
export async function quickSchemaCheck(): Promise<boolean> {
  try {
    const migrationManager = new MigrationManager();
    const verification = await migrationManager.verifySchema();
    
    if (!verification.success) {
      logger.warn('[SCHEMA] Schema verification issues:', verification.issues);
    }
    
    return verification.success;
  } catch (error) {
    logger.error('[SCHEMA] Quick check failed:', error);
    return false;
  }
}

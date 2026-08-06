import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Migration files for CockroachDB
const MIGRATION_FILES = [
  '001_initial_schema_cockroachdb.sql',
  '002_views_functions_cockroachdb.sql',
  '003_rls_policies_cockroachdb.sql',
  '004_add_missing_customer_fields_cockroachdb.sql',
  '005_add_connection_request_fields_cockroachdb.sql',
  '006_make_customer_id_nullable_cockroachdb.sql',
  '007_create_connection_expenses_cockroachdb.sql',
  '008_isp_erp_phase1_updates_cockroachdb.sql',
  '009_add_read_at_column_cockroachdb.sql',
  '010_fix_rls_policies_cockroachdb.sql',
  '011_fix_views_security_definer_cockroachdb.sql',
  '012_fix_connection_expenses_rls_cockroachdb.sql',
  '013_phase2_advanced_customer_management_cockroachdb.sql'
];

class CockroachDBMigrationRunner {
  private pool: Pool;
  private migrationDir: string;

  constructor() {
    this.migrationDir = join(__dirname, 'cockroachdb');
  }

  async connect(): Promise<void> {
    const connectionString = process.env.COCKROACHDB_CONNECTION_STRING || 
      `postgresql://${process.env.COCKROACHDB_USER}:${process.env.COCKROACHDB_PASSWORD}@${process.env.COCKROACHDB_HOST}:${process.env.COCKROACHDB_PORT}/${process.env.COCKROACHDB_DATABASE}`;
    
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    try {
      await this.pool.query('SELECT NOW()');
      logger.info('Connected to CockroachDB successfully');
    } catch (error) {
      logger.error('Failed to connect to CockroachDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info('Disconnected from CockroachDB');
    }
  }

  async runMigrations(): Promise<void> {
    logger.info('Starting CockroachDB migrations...');
    
    try {
      for (const migrationFile of MIGRATION_FILES) {
        logger.info(`Running migration: ${migrationFile}`);
        await this.runMigration(migrationFile);
      }
      
      logger.info('All CockroachDB migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  private async runMigration(filename: string): Promise<void> {
    const migrationPath = join(this.migrationDir, filename);
    
    try {
      const sql = readFileSync(migrationPath, 'utf8');
      
      await this.pool.query(sql);
      logger.info(`Migration ${filename} executed successfully`);
    } catch (error) {
      logger.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }

  async rollbackMigrations(): Promise<void> {
    logger.warn('Rollback not implemented for CockroachDB migrations');
    logger.warn('Manual rollback required');
  }

  async checkStatus(): Promise<void> {
    try {
      const result = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      logger.info('Current tables in database:');
      result.rows.forEach((row: any) => {
        logger.info(`  - ${row.table_name}`);
      });
    } catch (error) {
      logger.error('Failed to check database status:', error);
    }
  }
}

// Run migrations if called directly
if (require.main === module) {
  const runner = new CockroachDBMigrationRunner();
  
  runner.connect()
    .then(() => runner.runMigrations())
    .then(() => runner.checkStatus())
    .then(() => runner.disconnect())
    .then(() => {
      logger.info('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default CockroachDBMigrationRunner;
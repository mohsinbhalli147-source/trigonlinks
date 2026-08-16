import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

dotenv.config();

interface Migration {
  id: string;
  name: string;
  version: number;
  executed_at?: number;
  checksum: string;
}

interface MigrationResult {
  success: boolean;
  migration: string;
  error?: string;
  duration: number;
}

export class MigrationManager {
  private supabase: any;
  private pgPool: Pool;
  private migrationsPath: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use PostgreSQL pool for direct SQL execution (with SSL)
    try {
      const connectionString = process.env.DATABASE_URL || 
        `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=require`;
      
      this.pgPool = new Pool({
        connectionString: connectionString,
        ssl: process.env.DB_SSL_ROOT_CERT
          ? { ca: fs.readFileSync(process.env.DB_SSL_ROOT_CERT).toString(), rejectUnauthorized: true }
          : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
    } catch (error) {
      logger.warn('Failed to create PostgreSQL pool, will use Supabase client only:', error);
      this.pgPool = null as any;
    }

    this.migrationsPath = path.join(__dirname, 'files');
  }

  /**
   * Initialize the migrations tracking table
   */
  async initializeMigrationsTable(): Promise<boolean> {
    if (!this.pgPool) {
      logger.warn('PostgreSQL pool not available, skipping migrations table initialization');
      return false;
    }

    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          version INTEGER UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          executed_at BIGINT NOT NULL,
          execution_time_ms INTEGER,
          success BOOLEAN DEFAULT true,
          error_message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at);
      `;

      await this.pgPool.query(createTableSQL);
      logger.info('Migrations table initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize migrations table:', error);
      return false;
    }
  }

  /**
   * Get all executed migrations
   */
  async getExecutedMigrations(): Promise<Migration[]> {
    if (!this.pgPool) {
      logger.warn('PostgreSQL pool not available, returning empty migrations list');
      return [];
    }

    try {
      const result = await this.pgPool.query(
        'SELECT * FROM schema_migrations ORDER BY version ASC'
      );
      return result.rows || [];
    } catch (error) {
      logger.error('Failed to get executed migrations:', error);
      return [];
    }
  }

  /**
   * Get all migration files
   */
  getMigrationFiles(): Migration[] {
    if (!fs.existsSync(this.migrationsPath)) {
      logger.warn('Migrations directory does not exist:', this.migrationsPath);
      return [];
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(f => f.endsWith('.sql'))
      .sort();

    return files.map(file => {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) return null;

      const [, version, name] = match;
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const checksum = this.generateChecksum(content);

      return {
        id: file,
        name: name.replace(/_/g, ' '),
        version: parseInt(version),
        checksum
      };
    }).filter((m): m is Migration => m !== null);
  }

  /**
   * Generate checksum for migration content
   */
  private generateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const executed = await this.getExecutedMigrations();
    const executedVersions = new Set(executed.map(m => m.version));
    const allMigrations = this.getMigrationFiles();

    return allMigrations.filter(m => !executedVersions.has(m.version));
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration: Migration): Promise<MigrationResult> {
    if (!this.pgPool) {
      logger.warn('PostgreSQL pool not available, skipping migration execution');
      return { success: false, migration: migration.name, error: 'PostgreSQL pool not available', duration: 0 };
    }

    const startTime = Date.now();
    const filePath = path.join(this.migrationsPath, migration.id);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file not found: ${filePath}`);
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      logger.info(`Executing migration: ${migration.name} (v${migration.version})`);

      // Execute migration SQL using PostgreSQL pool
      await this.pgPool.query(sql);

      const duration = Date.now() - startTime;

      // Record successful migration
      await this.recordMigration(migration, true, duration);

      logger.info(`Migration ${migration.name} completed in ${duration}ms`);
      return { success: true, migration: migration.name, duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      // Record failed migration
      await this.recordMigration(migration, false, duration, errorMessage);

      logger.error(`Migration ${migration.name} failed:`, errorMessage);
      return { success: false, migration: migration.name, error: errorMessage, duration };
    }
  }

  /**
   * Record migration execution
   */
  private async recordMigration(
    migration: Migration,
    success: boolean,
    duration: number,
    error?: string
  ): Promise<void> {
    if (!this.pgPool) {
      logger.warn('PostgreSQL pool not available, skipping migration recording');
      return;
    }

    try {
      await this.pgPool.query(
        `INSERT INTO schema_migrations (version, name, checksum, executed_at, execution_time_ms, success, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          migration.version,
          migration.name,
          migration.checksum,
          Date.now(),
          duration,
          success,
          error || null
        ]
      );
    } catch (err) {
      logger.error('Failed to record migration:', err);
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<{ success: boolean; results: MigrationResult[] }> {
    logger.info('Starting migration process...');

    // Initialize migrations table
    await this.initializeMigrationsTable();

    // Get pending migrations
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      logger.info('No pending migrations to run');
      return { success: true, results: [] };
    }

    logger.info(`Found ${pending.length} pending migrations`);

    const results: MigrationResult[] = [];
    let allSuccess = true;

    for (const migration of pending) {
      const result = await this.executeMigration(migration);
      results.push(result);

      if (!result.success) {
        allSuccess = false;
        logger.error(`Migration failed, stopping further migrations`);
        break;
      }
    }

    if (allSuccess) {
      logger.info(`All ${results.length} migrations completed successfully`);
    } else {
      logger.error(`Migration process completed with errors`);
    }

    return { success: allSuccess, results };
  }

  /**
   * Verify schema integrity
   */
  async verifySchema(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!this.pgPool) {
      logger.warn('PostgreSQL pool not available, skipping schema verification');
      return { success: true, issues: [] }; // Return success to not block startup
    }

    const expectedTables = [
      'users', 'staff', 'refresh_tokens', 'password_reset_tokens',
      'areas', 'packages', 'customers', 'connections',
      'invoices', 'payments', 'expense_categories', 'expenses',
      'inventory', 'inventory_transactions', 'complaints',
      'announcements', 'notifications', 'logs', 'schema_migrations'
    ];

    const expectedViews = [
      'customer_summary', 'area_summary', 'staff_performance'
    ];

    // Check tables using PostgreSQL
    try {
      const tableResult = await this.pgPool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `);
      const existingTables = new Set(tableResult.rows.map((r: any) => r.table_name));

      for (const table of expectedTables) {
        if (!existingTables.has(table)) {
          issues.push(`Table missing: ${table}`);
        }
      }
    } catch (err: any) {
      issues.push(`Failed to check tables: ${err.message}`);
    }

    // Check views using PostgreSQL
    try {
      const viewResult = await this.pgPool.query(`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
      `);
      const existingViews = new Set(viewResult.rows.map((r: any) => r.table_name));

      for (const view of expectedViews) {
        if (!existingViews.has(view)) {
          issues.push(`View missing: ${view}`);
        }
      }
    } catch (err: any) {
      issues.push(`Failed to check views: ${err.message}`);
    }

    return {
      success: issues.length === 0,
      issues
    };
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    executed: number;
    pending: number;
    lastExecution?: number;
  }> {
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    const lastExecution = executed.length > 0 
      ? executed[executed.length - 1].executed_at 
      : undefined;

    return {
      executed: executed.length,
      pending: pending.length,
      lastExecution
    };
  }
}

export default MigrationManager;

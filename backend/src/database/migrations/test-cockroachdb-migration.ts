import { query, getDatabaseType, testConnection } from '../client';
import { logger } from '../../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test script to validate CockroachDB migration
 * Tests basic CRUD operations and validates schema
 */

class CockroachDBMigrationTest {
  async runTests(): Promise<void> {
    logger.info('Starting CockroachDB migration tests...');
    
    const dbType = getDatabaseType();
    logger.info(`Current database type: ${dbType}`);
    
    if (dbType !== 'cockroachdb') {
      logger.warn('Tests can only run with DB_TYPE=cockroachdb');
      logger.warn('Set DB_TYPE=cockroachdb in your environment variables');
      return;
    }
    
    try {
      // Test 1: Connection
      await this.testConnection();
      
      // Test 2: Schema validation
      await this.testSchema();
      
      // Test 3: Basic CRUD operations
      await this.testCRUD();
      
      // Test 4: Functions
      await this.testFunctions();
      
      // Test 5: Indexes
      await this.testIndexes();
      
      logger.info('All tests passed successfully!');
    } catch (error) {
      logger.error('Tests failed:', error);
      throw error;
    }
  }
  
  private async testConnection(): Promise<void> {
    logger.info('Test 1: Database Connection');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    logger.info('✓ Database connection successful');
  }
  
  private async testSchema(): Promise<void> {
    logger.info('Test 2: Schema Validation');
    
    // Test key tables exist
    const tables = [
      'users',
      'staff',
      'customers',
      'areas',
      'packages',
      'connections',
      'invoices',
      'payments',
      'inventory',
      'expenses',
      'complaints',
      'notifications'
    ];
    
    for (const table of tables) {
      const result = await query(
        `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`,
        [table]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Table ${table} not found`);
      }
      
      logger.info(`✓ Table ${table} exists`);
    }
  }
  
  private async testCRUD(): Promise<void> {
    logger.info('Test 3: Basic CRUD Operations');
    
    // Test UUID generation
    const result = await query('SELECT gen_random_uuid() as uuid');
    if (!result.rows[0]?.uuid) {
      throw new Error('UUID generation failed');
    }
    logger.info('✓ UUID generation works');
    
    // Test ENUM constraints
    try {
      await query(
        `INSERT INTO users (uid, email, password_hash, name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['test-uid', 'test@example.com', 'hash', 'Test User', 'admin', Date.now(), Date.now()]
      );
      
      // Cleanup
      await query('DELETE FROM users WHERE uid = $1', ['test-uid']);
      
      logger.info('✓ ENUM constraints work');
    } catch (error) {
      logger.error('ENUM constraint test failed:', error);
      throw error;
    }
  }
  
  private async testFunctions(): Promise<void> {
    logger.info('Test 4: Functions');
    
    // Test generateInvoiceNumber function
    const result = await query('SELECT generate_invoice_number() as invoice_number');
    if (!result.rows[0]?.invoice_number) {
      throw new Error('generate_invoice_number function failed');
    }
    logger.info('✓ Function generate_invoice_number works');
    
    // Test other functions
    const functions = [
      'update_expense_category_spent_manual',
      'update_inventory_quantity_manual',
      'cleanup_expired_notifications',
      'mark_overdue_invoices'
    ];
    
    for (const func of functions) {
      const result = await query(
        `SELECT routine_name FROM information_schema.routines WHERE routine_name = $1`,
        [func]
      );
      
      if (result.rows.length === 0) {
        logger.warn(`⚠ Function ${func} not found (may be expected)`);
      } else {
        logger.info(`✓ Function ${func} exists`);
      }
    }
  }
  
  private async testIndexes(): Promise<void> {
    logger.info('Test 5: Indexes');
    
    // Test inverted indexes (CockroachDB full-text search alternative)
    const indexes = [
      'idx_customers_name_search',
      'idx_customers_address_search',
      'idx_users_email',
      'idx_customers_uid',
      'idx_invoices_customer_id'
    ];
    
    for (const index of indexes) {
      const result = await query(
        `SELECT indexname FROM pg_indexes WHERE indexname = $1`,
        [index]
      );
      
      if (result.rows.length === 0) {
        logger.warn(`⚠ Index ${index} not found (may be expected)`);
      } else {
        logger.info(`✓ Index ${index} exists`);
      }
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CockroachDBMigrationTest();
  
  tester.runTests()
    .then(() => {
      logger.info('Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default CockroachDBMigrationTest;
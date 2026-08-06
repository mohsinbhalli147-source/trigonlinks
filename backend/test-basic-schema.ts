import { query } from './src/database/client';
import { readFileSync } from 'fs';
import { logger } from './src/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

async function testBasicSchema() {
  try {
    logger.info('Testing basic schema creation...');
    
    const sql = readFileSync('./src/database/migrations/cockroachdb/test_basic_schema.sql', 'utf8');
    
    await query(sql);
    
    logger.info('✅ Basic schema test successful!');
    
    // Check tables
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'test_%'
      ORDER BY table_name
    `);
    
    logger.info('Created test tables:');
    result.rows.forEach((row: any) => {
      logger.info(`  - ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Basic schema test failed:', error);
    process.exit(1);
  }
}

testBasicSchema();
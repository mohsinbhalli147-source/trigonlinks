import { query } from './src/database/client';
import { logger } from './src/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
  try {
    logger.info('Checking current schema...');
    
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    logger.info('Current tables in database:');
    result.rows.forEach((row: any) => {
      logger.info(`  - ${row.table_name}`);
    });
    
    logger.info(`Total tables: ${result.rows.length}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Failed to check schema:', error);
    process.exit(1);
  }
}

checkSchema();
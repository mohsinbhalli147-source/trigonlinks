import { query } from './src/database/client';
import { readFileSync } from 'fs';
import { logger } from './src/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

async function runSingleMigration(migrationFile: string) {
  try {
    logger.info(`Running migration: ${migrationFile}`);
    
    const sql = readFileSync(migrationFile, 'utf8');
    
    logger.info('Executing SQL...');
    await query(sql);
    
    logger.info(`✅ Migration ${migrationFile} successful!`);
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Migration ${migrationFile} failed:`, error);
    process.exit(1);
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  logger.error('Please provide migration file path');
  process.exit(1);
}

runSingleMigration(migrationFile);
import { testConnection, getDatabaseType } from './src/database/client';
import { logger } from './src/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  logger.info('Testing database connection...');
  logger.info(`Database type: ${getDatabaseType()}`);
  
  const connected = await testConnection();
  
  if (connected) {
    logger.info('✅ Database connection successful!');
    process.exit(0);
  } else {
    logger.error('❌ Database connection failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Test failed:', error);
  process.exit(1);
});
import { MigrationManager } from '../src/database/migrations/migration-manager';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('=== Database Migration Runner ===\n');

  const migrationManager = new MigrationManager();

  // Get current status
  console.log('Checking migration status...');
  const status = await migrationManager.getStatus();
  console.log(`Executed: ${status.executed}`);
  console.log(`Pending: ${status.pending}`);
  if (status.lastExecution && typeof status.lastExecution === 'number' && status.lastExecution > 0) {
    try {
      console.log(`Last execution: ${new Date(status.lastExecution).toISOString()}`);
    } catch (e) {
      console.log(`Last execution: ${status.lastExecution} (invalid timestamp)`);
    }
  }
  console.log();

  // Run migrations
  console.log('Running migrations...');
  const result = await migrationManager.runMigrations();

  console.log('\n=== Migration Results ===');
  result.results.forEach(r => {
    const status = r.success ? '✓' : '✗';
    console.log(`${status} ${r.migration} (${r.duration}ms)`);
    if (!r.success && r.error) {
      console.log(`  Error: ${r.error}`);
    }
  });

  console.log(`\nOverall: ${result.success ? 'SUCCESS' : 'FAILED'}`);

  // Verify schema
  console.log('\n=== Schema Verification ===');
  const verification = await migrationManager.verifySchema();
  
  if (verification.success) {
    console.log('✓ Schema verification passed');
  } else {
    console.log('✗ Schema verification failed');
    verification.issues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  process.exit(result.success ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function verifySchema() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Verifying PostgreSQL schema...\n');

  const expectedTables = [
    'users',
    'staff',
    'refresh_tokens',
    'areas',
    'packages',
    'customers',
    'connections',
    'invoices',
    'payments',
    'expense_categories',
    'expenses',
    'inventory',
    'inventory_transactions',
    'complaints',
    'announcements',
    'notifications',
    'logs'
  ];

  const expectedViews = [
    'customer_summary',
    'area_summary',
    'staff_performance'
  ];

  let tablesFound = 0;
  let viewsFound = 0;

  console.log('Checking tables:');
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✓ ${table}`);
        tablesFound++;
      } else {
        console.log(`✗ ${table} - ${error.message}`);
      }
    } catch (err: any) {
      console.log(`✗ ${table} - ${err.message}`);
    }
  }

  console.log('\nChecking views:');
  for (const view of expectedViews) {
    try {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✓ ${view}`);
        viewsFound++;
      } else {
        console.log(`✗ ${view} - ${error.message}`);
      }
    } catch (err: any) {
      console.log(`✗ ${view} - ${err.message}`);
    }
  }

  console.log(`\nSummary: ${tablesFound}/${expectedTables.length} tables, ${viewsFound}/${expectedViews.length} views created`);
  
  if (tablesFound === expectedTables.length && viewsFound === expectedViews.length) {
    console.log('✅ Schema verification successful!');
  } else {
    console.log('❌ Schema verification failed - some objects missing');
  }
}

verifySchema()
  .then(() => {
    console.log('\nVerification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });

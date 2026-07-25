import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLES = [
  'users',
  'staff',
  'refresh_tokens',
  'password_reset_tokens',
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

async function testDatabaseConnection() {
  console.log('Testing database connection...\n');

  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }

    console.log('✅ Database connection successful\n');
    console.log('Verifying all tables exist...\n');

    let allTablesExist = true;

    for (const table of TABLES) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1);

        if (tableError) {
          console.error(`❌ Table '${table}' does not exist or is not accessible:`, tableError.message);
          allTablesExist = false;
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (err: any) {
        console.error(`❌ Error checking table '${table}':`, err.message);
        allTablesExist = false;
      }
    }

    console.log('\n' + '='.repeat(50));
    
    if (allTablesExist) {
      console.log('✅ All tables verified successfully');
      process.exit(0);
    } else {
      console.log('❌ Some tables are missing or inaccessible');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabaseConnection();

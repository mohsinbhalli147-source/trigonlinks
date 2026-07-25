import { getSupabaseClient } from '../src/database/client';

const supabase = getSupabaseClient();

async function runStaffMigration() {
  console.log('Starting staff table migration...');

  try {
    // Step 1: Add new columns to staff table if they don't exist
    console.log('Adding new columns to staff table...');

    // Check and add salary column
    const { data: columns } = await supabase.rpc('get_table_columns', { table_name: 'staff' });
    const hasSalary = columns?.some((col: any) => col.column_name === 'salary');
    
    if (!hasSalary) {
      await supabase.rpc('execute_sql', { 
        sql: 'ALTER TABLE staff ADD COLUMN salary DECIMAL(10, 2) DEFAULT 0.00;' 
      });
      console.log('✓ Added salary column');
    } else {
      console.log('✓ Salary column already exists');
    }

    // Check and add hire_date column
    const hasHireDate = columns?.some((col: any) => col.column_name === 'hire_date');
    
    if (!hasHireDate) {
      await supabase.rpc('execute_sql', { 
        sql: 'ALTER TABLE staff ADD COLUMN hire_date BIGINT;' 
      });
      console.log('✓ Added hire_date column');
    } else {
      console.log('✓ Hire date column already exists');
    }

    // Check and add address column
    const hasAddress = columns?.some((col: any) => col.column_name === 'address');
    
    if (!hasAddress) {
      await supabase.rpc('execute_sql', { 
        sql: 'ALTER TABLE staff ADD COLUMN address TEXT;' 
      });
      console.log('✓ Added address column');
    } else {
      console.log('✓ Address column already exists');
    }

    // Step 2: Update existing staff records with default hire_date if null
    console.log('Updating existing staff records...');
    await supabase
      .from('staff')
      .update({ hire_date: supabase.raw('COALESCE(hire_date, created_at)') })
      .is('hire_date', null);
    console.log('✓ Updated staff records with default hire_date');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runStaffMigration();

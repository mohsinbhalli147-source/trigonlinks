const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying staff table migration...\n');

  try {
    // Check current columns
    console.log('1. Checking current staff table structure...');
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'staff' });

    if (columnError) {
      console.log('Note: Cannot check columns directly, will attempt to add columns...');
    } else {
      console.log('Current columns:', columns?.map(c => c.column_name).join(', '));
    }

    // Try to add columns using direct SQL via Supabase REST API
    console.log('\n2. Attempting to add salary column...');
    try {
      // Use raw SQL through Supabase
      const { error: salaryError } = await supabase
        .from('staff')
        .select('salary')
        .limit(1);
      
      if (salaryError && salaryError.code === '42703') {
        console.log('  - Salary column missing, need to add manually via Supabase SQL Editor');
      } else {
        console.log('  ✓ Salary column exists');
      }
    } catch (e) {
      console.log('  - Salary column missing, need to add manually via Supabase SQL Editor');
    }

    console.log('\n3. Attempting to add hire_date column...');
    try {
      const { error: hireDateError } = await supabase
        .from('staff')
        .select('hire_date')
        .limit(1);
      
      if (hireDateError && hireDateError.code === '42703') {
        console.log('  - Hire date column missing, need to add manually via Supabase SQL Editor');
      } else {
        console.log('  ✓ Hire date column exists');
      }
    } catch (e) {
      console.log('  - Hire date column missing, need to add manually via Supabase SQL Editor');
    }

    console.log('\n4. Attempting to add address column...');
    try {
      const { error: addressError } = await supabase
        .from('staff')
        .select('address')
        .limit(1);
      
      if (addressError && addressError.code === '42703') {
        console.log('  - Address column missing, need to add manually via Supabase SQL Editor');
      } else {
        console.log('  ✓ Address column exists');
      }
    } catch (e) {
      console.log('  - Address column missing, need to add manually via Supabase SQL Editor');
    }

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('\nIf any columns are missing, please run this SQL in Supabase SQL Editor:');
    console.log('\nhttps://supabase.com/dashboard/project/unvznjnwekrjobwfxhwn/sql\n');
    console.log('```sql');
    console.log('-- Add salary column');
    console.log('ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary DECIMAL(10, 2) DEFAULT 0.00;');
    console.log('');
    console.log('-- Add hire_date column');
    console.log('ALTER TABLE staff ADD COLUMN IF NOT EXISTS hire_date BIGINT;');
    console.log('');
    console.log('-- Add address column');
    console.log('ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;');
    console.log('');
    console.log('-- Update existing records');
    console.log('UPDATE staff SET hire_date = created_at WHERE hire_date IS NULL;');
    console.log('```');
    console.log('\nAfter running the SQL, run the test script again:');
    console.log('node backend/test-staff-api.js');

  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();

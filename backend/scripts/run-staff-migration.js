const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Starting staff table migration...');

  try {
    // Check if columns exist by trying to select them
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('id, salary, hire_date, address')
      .limit(1);

    if (checkError) {
      console.log('Checking column status:', checkError.message);
      
      // Try to add columns using direct SQL through the database
      console.log('Note: Columns may need to be added manually via Supabase SQL Editor');
      console.log('Please run the following SQL in Supabase SQL Editor:');
      console.log(`
-- Add salary column
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary DECIMAL(10, 2) DEFAULT 0.00;

-- Add hire_date column  
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hire_date BIGINT;

-- Add address column
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing records
UPDATE staff SET hire_date = created_at WHERE hire_date IS NULL;
      `);
    } else {
      console.log('✓ All columns already exist');
    }

    // Update existing records with default hire_date
    console.log('Updating existing staff records...');
    const { data: staffToUpdate, error: fetchError } = await supabase
      .from('staff')
      .select('id, created_at, hire_date')
      .is('hire_date', null);

    if (staffToUpdate && staffToUpdate.length > 0) {
      for (const staff of staffToUpdate) {
        await supabase
          .from('staff')
          .update({ hire_date: staff.created_at })
          .eq('id', staff.id);
      }
      console.log(`✓ Updated ${staffToUpdate.length} staff records`);
    } else {
      console.log('✓ No records need updating');
    }

    console.log('Migration check completed!');
    console.log('If columns were missing, please run the SQL commands above in Supabase SQL Editor');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function createTablesViaAPI() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Creating tables via Supabase REST API...');

  // Try to create users table using REST API
  try {
    const { error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('Table does not exist, need to create via SQL Editor');
      console.log('Please execute the schema via Supabase Dashboard SQL Editor:');
      console.log('https://supabase.com/dashboard/project/unvznjnwekrjobwfxhwn/sql/new');
      console.log('\nCopy the content from: backend/src/database/schema.sql');
      return;
    }
    
    console.log('Users table exists or can be accessed');
  } catch (error) {
    console.error('Error checking table:', error);
  }
}

createTablesViaAPI()
  .then(() => {
    console.log('Table check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Table check failed:', error);
    process.exit(1);
  });

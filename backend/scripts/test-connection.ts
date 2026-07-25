import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('Has ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
    
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Test connection by querying the database
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
    
    console.log('Connection successful!');
    console.log('Test query result:', data);
  } catch (error) {
    console.error('Connection test error:', error);
    throw error;
  }
}

testConnection()
  .then(() => {
    console.log('Connection test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Connection test failed:', error);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCustomers() {
  console.log('=== Checking Customers Table ===\n');

  // Get all customers
  const { data, error } = await supabase.from('customers').select('*').limit(10);
  
  if (error) {
    console.error('Error fetching customers:', error);
    return;
  }

  console.log(`Found ${data.length} customers`);
  
  if (data.length > 0) {
    console.log('\nSample customer:');
    console.log(JSON.stringify(data[0], null, 2));
  }

  // Check if test customer exists
  const { data: testCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('username', 'test_customer')
    .limit(1);

  console.log('\nTest customer exists:', testCustomer && testCustomer.length > 0);
  
  if (testCustomer && testCustomer.length > 0) {
    console.log('Test customer data:', JSON.stringify(testCustomer[0], null, 2));
  }
}

checkCustomers().catch(console.error);

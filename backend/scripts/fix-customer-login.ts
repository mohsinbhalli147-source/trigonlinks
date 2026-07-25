import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixCustomerLogin() {
  console.log('=== Fixing Customer Login Data ===\n');

  // Get all customers
  const { data: customers, error } = await supabase.from('customers').select('*');
  
  if (error) {
    console.error('Error fetching customers:', error);
    return;
  }

  console.log(`Found ${customers.length} customers`);

  // Update customers to add username and cnic if missing
  for (const customer of customers) {
    const updates: any = {};
    
    if (!customer.username) {
      // Generate username from name
      const name = customer.name || 'customer';
      updates.username = name.toLowerCase().replace(/\s+/g, '_') + '_' + customer.uid.substring(0, 4);
    }
    
    if (!customer.cnic) {
      // Generate a test CNIC
      updates.cnic = '12345-' + customer.uid.substring(0, 7) + '-1';
    }
    
    if (Object.keys(updates).length > 0) {
      console.log(`Updating customer ${customer.name}:`, updates);
      
      const { error: updateError } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customer.id);
      
      if (updateError) {
        console.error('Error updating customer:', updateError);
      } else {
        console.log('✓ Updated successfully');
      }
    }
  }

  console.log('\n=== Verification ===');
  
  // Check updated customers
  const { data: updatedCustomers } = await supabase.from('customers').select('name, username, cnic').limit(5);
  console.log('Sample customers with login credentials:');
  console.log(JSON.stringify(updatedCustomers, null, 2));
}

fixCustomerLogin().catch(console.error);

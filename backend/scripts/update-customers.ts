import { getSupabaseClient } from '../src/database/client';
import { CustomersRepository } from '../src/repositories/CustomersRepository';

const supabase = getSupabaseClient();
const customersRepo = new CustomersRepository();

async function updateAllCustomers() {
  try {
    console.log('Starting customer update...');
    console.log('Setting billing_date=1, install_date=1, address=Pasrur for all customers');

    // Get all customers
    const customers = await customersRepo.findAll();
    console.log(`Found ${customers.length} customers`);

    let updated = 0;
    let errors = 0;

    for (const customer of customers as any[]) {
      try {
        // Set billing_date to 1st of current month
        const now = new Date();
        const billingDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        
        // Set install_date to 1st of current month if not set, otherwise keep as is
        const installDate = customer.install_date || new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const updateData = {
          billing_date: billingDate,
          install_date: installDate,
          address: 'Pasrur',
          updated_at: Date.now()
        };

        const { error } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customer.id);

        if (error) {
          console.error(`Error updating customer ${customer.name}:`, error);
          errors++;
        } else {
          updated++;
          console.log(`Updated customer: ${customer.name}`);
        }

      } catch (error: any) {
        console.error(`Error processing customer ${customer.name}:`, error);
        errors++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total customers: ${customers.length}`);
    console.log(`Updated successfully: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log('\nCustomer update completed!');

  } catch (error) {
    console.error('Error in updateAllCustomers:', error);
    process.exit(1);
  }
}

updateAllCustomers();
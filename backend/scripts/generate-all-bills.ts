import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import { getSupabaseClient } from '../src/database/client';
import { CustomersRepository } from '../src/repositories/CustomersRepository';
import { PackagesRepository } from '../src/repositories/PackagesRepository';
import { InvoicesRepository } from '../src/repositories/InvoicesRepository';

const supabase = getSupabaseClient();
const customersRepo = new CustomersRepository();
const packagesRepo = new PackagesRepository();
const invoicesRepo = new InvoicesRepository();

interface InvoiceData {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  invoice_number: string;
  amount: number;
  due_date: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  paid_amount: number;
  package: string;
  remaining_balance: number;
  created_at: number;
  created_by: string;
}

// Generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date();
  const monthYear = format(now, 'yyyyMM');
  
  // Get the highest invoice number for this month
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .gte('invoice_number', `INV-${monthYear}`)
    .lt('invoice_number', `INV-${monthYear}99`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) throw error;

  let sequence = 1;
  if (data && data.length > 0) {
    const lastInvoice = data[0].invoice_number;
    const lastSequence = parseInt(lastInvoice.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${monthYear}-${sequence.toString().padStart(4, '0')}`;
};

async function generateAllBills(forceRegenerate: boolean = false) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    console.log('Starting bill generation for all customers...');
    console.log(`Billing month: ${currentMonth + 1}/${currentYear}`);
    console.log(`Force regenerate: ${forceRegenerate}`);

    // If force regenerate, delete all invoices for current month first
    if (forceRegenerate) {
      const monthStart = new Date(currentYear, currentMonth, 1).getTime();
      const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).getTime();
      
      console.log('Deleting all existing invoices for current month...');
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);
      
      if (deleteError) {
        console.error('Error deleting existing invoices:', deleteError);
      } else {
        console.log('Deleted all existing invoices for current month');
      }
    }

    // Get all active customers
    const customers = await customersRepo.findAll();
    const activeCustomers = customers.filter((c: any) => c.status === 'active');

    console.log(`Found ${activeCustomers.length} active customers`);

    let billsGenerated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const customer of activeCustomers as any[]) {
      try {
        // Check if bill already exists for this month (by checking if any invoice was created this month)
        const monthStart = new Date(currentYear, currentMonth, 1).getTime();
        const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).getTime();

        const { data: existingBill } = await supabase
          .from('invoices')
          .select('id')
          .eq('customer_id', customer.id)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd)
          .limit(1);

        if (!forceRegenerate && existingBill && existingBill.length > 0) {
          console.log(`Skipping ${customer.name} - bill already exists for this month`);
          skipped++;
          continue;
        }

        // Get customer package
        let packagePrice = 0;
        let packageName = 'Unknown';
        
        // First try to use customer fee directly
        if (customer.fee) {
          packagePrice = Number(customer.fee);
          packageName = customer.package || 'Custom Package';
        } else if (customer.package) {
          // If fee not set, try to get from package repository
          const pkg = await packagesRepo.findByName(customer.package);
          if (pkg) {
            packagePrice = pkg.price || 0;
            packageName = pkg.name || 'Unknown';
          }
        }

        // Calculate total amount
        let totalAmount = packagePrice;
        
        // Add IPTV charges if enabled
        const iptvCharges = customer.iptv_enabled ? (customer.iptv_monthly_charges || 0) : 0;
        totalAmount += iptvCharges;

        // Add Live IP charges if enabled
        const liveIpCharges = customer.live_ip_enabled ? (customer.live_ip_monthly_fee || 0) : 0;
        totalAmount += liveIpCharges;

        // Add install fee if it's the first month and not paid
        const isFirstMonth = customer.install_date && 
          new Date(customer.install_date).getMonth() === currentMonth &&
          new Date(customer.install_date).getFullYear() === currentYear;
        const installFee = isFirstMonth && customer.install_fee && !customer.install_fee_paid ? Number(customer.install_fee) : 0;
        totalAmount += installFee;

        // Add previous balance if any
        const previousBalance = customer.previous_balance || 0;
        totalAmount += previousBalance;

        // Generate invoice
        const invoiceNumber = await generateInvoiceNumber();
        const dueDate = addMonths(now, 1).getTime(); // Due in 1 month

        const invoiceData: InvoiceData = {
          customer_id: customer.id,
          customer_name: customer.name,
          customer_phone: customer.mobile,
          invoice_number: invoiceNumber,
          amount: packagePrice,
          due_date: dueDate,
          status: 'unpaid',
          paid_amount: 0,
          package: packageName,
          remaining_balance: totalAmount,
          created_at: Date.now(),
          created_by: 'system'
        };

        await invoicesRepo.createInvoice(invoiceData);

        // Update customer's previous balance to 0 after billing
        if (previousBalance > 0) {
          await supabase
            .from('customers')
            .update({ previous_balance: 0 })
            .eq('id', customer.id);
        }

        billsGenerated++;
        console.log(`Generated bill for ${customer.name} - Invoice: ${invoiceNumber} - Amount: ${totalAmount}`);

      } catch (error: any) {
        console.error(`Error generating bill for customer ${customer.name}:`, error);
        errors.push(`Failed to generate bill for ${customer.name}: ${error.message}`);
      }
    }

    console.log('\n=== Bill Generation Summary ===');
    console.log(`Total active customers: ${activeCustomers.length}`);
    console.log(`Bills generated: ${billsGenerated}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\nBill generation completed!');

  } catch (error) {
    console.error('Error in generateAllBills:', error);
    process.exit(1);
  }
}

// Get command line arguments to check if force regenerate is requested
const forceRegenerate = process.argv.includes('--force');
generateAllBills(forceRegenerate);

import { startOfMonth, endOfMonth, isSameMonth, addMonths, format } from 'date-fns';
import { InvoicesRepository } from '../repositories/InvoicesRepository';
import { CustomersRepository } from '../repositories/CustomersRepository';
import { PackagesRepository } from '../repositories/PackagesRepository';
import { PaymentsRepository } from '../repositories/PaymentsRepository';
import { getSupabaseClient } from '../database/client';
import { createNotification } from './notifications';

const invoicesRepo = new InvoicesRepository();
const customersRepo = new CustomersRepository();
const packagesRepo = new PackagesRepository();
const paymentsRepo = new PaymentsRepository();
const supabase = getSupabaseClient();

export interface BillGenerationResult {
  success: boolean;
  message: string;
  billsGenerated?: number;
  errors?: string[];
}

export interface InvoiceData {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  invoice_number: string;
  amount: number;
  due_date: number;
  billing_period_start: number;
  billing_period_end: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  paid_amount: number;
  package: string;
  package_price: number;
  install_fee?: number;
  previous_balance?: number;
  total_amount: number;
  notes?: string;
  created_at: number;
  created_by: string;
  iptv_charges?: number;
  live_ip_charges?: number;
  installation_charges?: number;
  previous_due_amount?: number;
  discount_amount?: number;
  discount_reason?: string;
  total_payable?: number;
  remaining_balance?: number;
}

// Generate invoice number
export const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date();
  const monthYear = format(now, 'yyyyMM');
  
  // Get the last invoice number for this month
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

// Generate monthly bills for all active customers
export const generateMonthlyBills = async (adminUserId: string, forceAll: boolean = false): Promise<BillGenerationResult> => {
  try {
    const now = new Date();
    const currentDay = now.getDate();

    // Get all active customers
    const customers = await customersRepo.findAll();
    const activeCustomers = customers.filter((c: any) => c.status === 'active');

    let billsGenerated = 0;
    const errors: string[] = [];

    for (const customer of activeCustomers as any[]) {
      try {
        // Check if customer has a billing date
        const billingDate = customer.billing_date || customer.install_date;
        
        if (!billingDate) {
          errors.push(`Customer ${customer.name} has no billing date - using day 1`);
          // Use day 1 as default billing date
          customer.billing_date = 1;
        }

        const billingDateObj = new Date(billingDate);
        const billingDay = billingDateObj.getDate();

        // Only generate bill if today is the billing date, unless forceAll is true
        if (!forceAll && currentDay !== billingDay) {
          continue;
        }

        // Check if bill already exists for this month
        const monthStart = startOfMonth(now).getTime();
        const monthEnd = endOfMonth(now).getTime();

        const { data: existingBill } = await supabase
          .from('invoices')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('billing_period_start', monthStart)
          .eq('billing_period_end', monthEnd)
          .limit(1);

        if (existingBill && existingBill.length > 0) {
          continue; // Bill already generated
        }

        // Get customer package
        let packagePrice = 0;
        let packageName = 'Unknown';
        
        if (customer.package) {
          const pkg = await packagesRepo.findByName(customer.package);
          if (pkg) {
            packagePrice = pkg.price || 0;
            packageName = pkg.name || 'Unknown';
          }
        } else if (customer.fee) {
          packagePrice = Number(customer.fee);
          packageName = 'Custom Package';
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
        const isFirstMonth = customer.install_date && isSameMonth(new Date(customer.install_date), now);
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
          billing_period_start: monthStart,
          billing_period_end: monthEnd,
          status: 'unpaid',
          paid_amount: 0,
          package: packageName,
          package_price: packagePrice,
          install_fee: installFee > 0 ? installFee : undefined,
          previous_balance: previousBalance > 0 ? previousBalance : undefined,
          total_amount: totalAmount,
          notes: isFirstMonth ? 'Includes installation fee' : undefined,
          created_at: Date.now(),
          created_by: adminUserId,
          iptv_charges: iptvCharges > 0 ? iptvCharges : undefined,
          live_ip_charges: liveIpCharges > 0 ? liveIpCharges : undefined,
          installation_charges: installFee > 0 ? installFee : undefined,
          previous_due_amount: previousBalance > 0 ? previousBalance : undefined,
          total_payable: totalAmount,
          remaining_balance: totalAmount
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

      } catch (error) {
        console.error(`Error generating bill for customer ${customer.name}:`, error);
        errors.push(`Failed to generate bill for ${customer.name}: ${error}`);
      }
    }

    return {
      success: true,
      message: `Bill generation completed. ${billsGenerated} bills generated.`,
      billsGenerated,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Error in generateMonthlyBills:', error);
    return {
      success: false,
      message: 'Failed to generate monthly bills',
      errors: [String(error)]
    };
  }
};

// Generate bill for a specific customer
export const generateCustomerBill = async (
  customerId: string,
  adminUserId: string,
  customDate?: Date
): Promise<BillGenerationResult> => {
  try {
    const now = customDate || new Date();
    const monthStart = startOfMonth(now).getTime();
    const monthEnd = endOfMonth(now).getTime();

    // Get customer
    const customer = await customersRepo.findById(customerId);
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found'
      };
    }

    // Check if bill already exists for this month
    const { data: existingBill } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .eq('billing_period_start', monthStart)
      .eq('billing_period_end', monthEnd)
      .limit(1);

    if (existingBill && existingBill.length > 0) {
      // Return existing invoice so payment can still be processed
      return {
        success: true,
        message: 'Bill already exists for this billing period',
        billsGenerated: 0,
        invoice: existingBill[0]
      } as any;
    }

    // Get customer package
    let packagePrice = 0;
    let packageName = 'Unknown';
    
    if (customer.package) {
      const pkg = await packagesRepo.findByName(customer.package);
      if (pkg) {
        packagePrice = pkg.price || 0;
        packageName = pkg.name || 'Unknown';
      }
    } else if (customer.fee) {
      packagePrice = Number(customer.fee);
      packageName = 'Custom Package';
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
    const isFirstMonth = customer.install_date && isSameMonth(new Date(customer.install_date), now);
    const installFee = isFirstMonth && customer.install_fee && !customer.install_fee_paid ? Number(customer.install_fee) : 0;
    totalAmount += installFee;

    // Add previous balance if any
    const previousBalance = customer.previous_balance || 0;
    totalAmount += previousBalance;

    // Generate invoice
    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = addMonths(now, 1).getTime();

    const invoiceData: InvoiceData = {
      customer_id: customerId,
      customer_name: customer.name,
      customer_phone: customer.mobile,
      invoice_number: invoiceNumber,
      amount: packagePrice,
      due_date: dueDate,
      billing_period_start: monthStart,
      billing_period_end: monthEnd,
      status: 'unpaid',
      paid_amount: 0,
      package: packageName,
      package_price: packagePrice,
      install_fee: installFee > 0 ? installFee : undefined,
      previous_balance: previousBalance > 0 ? previousBalance : undefined,
      total_amount: totalAmount,
      notes: isFirstMonth ? 'Includes installation fee' : undefined,
      created_at: Date.now(),
      created_by: adminUserId,
      iptv_charges: iptvCharges > 0 ? iptvCharges : undefined,
      live_ip_charges: liveIpCharges > 0 ? liveIpCharges : undefined,
      installation_charges: installFee > 0 ? installFee : undefined,
      previous_due_amount: previousBalance > 0 ? previousBalance : undefined,
      total_payable: totalAmount,
      remaining_balance: totalAmount
    };

    const invoice = await invoicesRepo.createInvoice(invoiceData);

    // Update customer's previous balance to 0 after billing
    if (previousBalance > 0) {
      await supabase
        .from('customers')
        .update({ previous_balance: 0 })
        .eq('id', customerId);
    }

    return {
      success: true,
      message: 'Bill generated successfully',
      billsGenerated: 1,
      invoice
    } as any;

  } catch (error) {
    console.error('Error in generateCustomerBill:', error);
    return {
      success: false,
      message: 'Failed to generate customer bill',
      errors: [String(error)]
    };
  }
};

// Process payment for an invoice
export const processPayment = async (
  invoiceId: string,
  amount: number,
  paymentMethod: string,
  adminUserId: string,
  discountAmount?: number,
  discountReason?: string
): Promise<{ success: boolean; message: string; invoice?: any }> => {
  try {
    const invoice = await invoicesRepo.findById(invoiceId);
    if (!invoice) {
      return {
        success: false,
        message: 'Invoice not found'
      };
    }

    const currentPaid = invoice.paid_amount || 0;
    const totalPayable = invoice.total_payable || invoice.total_amount || invoice.amount || 0;
    const currentDiscount = invoice.discount_amount || 0;
    
    // Apply discount if provided
    let finalDiscount = currentDiscount;
    if (discountAmount && discountAmount > 0) {
      finalDiscount = currentDiscount + discountAmount;
    }

    // Calculate net amount after discount
    const netAmount = totalPayable - finalDiscount;
    
    // Calculate new paid amount
    const newPaidAmount = currentPaid + amount;
    
    // Calculate remaining balance
    const remainingBalance = netAmount - newPaidAmount;

    let newStatus = invoice.status || 'unpaid';
    
    if (remainingBalance <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    // Update invoice
    await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        payment_method: paymentMethod,
        discount_amount: finalDiscount > 0 ? finalDiscount : null,
        discount_reason: discountReason || invoice.discount_reason,
        remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
        last_payment_date: Date.now(),
        last_payment_amount: amount,
        updated_at: Date.now(),
        updated_by: adminUserId
      })
      .eq('id', invoiceId);

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        amount,
        payment_method: paymentMethod,
        discount_amount: discountAmount || null,
        discount_reason: discountReason || null,
        status: 'completed',
        created_at: Date.now(),
        created_by: adminUserId
      });

    // If payment includes advance payment, update customer's previous balance
    if (remainingBalance < 0) {
      const advancePayment = Math.abs(remainingBalance);
      await supabase
        .from('customers')
        .update({ previous_balance: advancePayment })
        .eq('id', invoice.customer_id);
    }

    // Create notification for customer about payment
    const customer = await customersRepo.findById(invoice.customer_id);
    if (customer && customer.uid) {
      const user = await supabase.from('users').select('id').eq('uid', customer.uid).limit(1).single();
      if (user.data) {
        await createNotification({
          user_id: user.data.id,
          type: 'payment',
          title: 'Payment Received',
          message: `Your payment of Rs. ${amount} for invoice ${invoice.invoice_number} has been received. Remaining balance: Rs. ${remainingBalance > 0 ? remainingBalance : 0}`,
          action_url: `/invoices/${invoiceId}`,
          action_text: 'View Invoice',
          related_id: invoiceId,
          related_type: 'invoice',
          is_read: false,
          expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Get updated invoice
    const updatedInvoice = await invoicesRepo.findById(invoiceId);

    return {
      success: true,
      message: 'Payment processed successfully',
      invoice: updatedInvoice
    };

  } catch (error) {
    console.error('Error in processPayment:', error);
    return {
      success: false,
      message: 'Failed to process payment'
    };
  }
};

// Mark overdue invoices
export const markOverdueInvoices = async (): Promise<{ success: boolean; message: string; count: number }> => {
  try {
    const now = Date.now();

    // Get all unpaid and partial invoices past due date
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .in('status', ['unpaid', 'partial'])
      .lt('due_date', now);

    if (error) throw error;

    // Count affected rows
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue');

    return {
      success: true,
      message: 'Invoices marked as overdue',
      count: count || 0
    };

  } catch (error) {
    console.error('Error in markOverdueInvoices:', error);
    return {
      success: false,
      message: 'Failed to mark overdue invoices',
      count: 0
    };
  }
};

// Get billing summary for a customer
export const getCustomerBillingSummary = async (customerId: string) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalBilled = invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || inv.amount || 0), 0);
    const totalPaid = invoices.reduce((sum: number, inv: any) => sum + (inv.paid_amount || 0), 0);
    const totalDue = totalBilled - totalPaid;

    const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'unpaid' || inv.status === 'overdue');
    const overdueInvoices = invoices.filter((inv: any) => inv.status === 'overdue');

    return {
      customerId,
      totalBilled,
      totalPaid,
      totalDue,
      unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length,
      recentInvoices: invoices.slice(0, 5)
    };
  } catch (error) {
    console.error('Error in getCustomerBillingSummary:', error);
    throw error;
  }
};


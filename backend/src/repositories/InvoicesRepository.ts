import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  package: string;
  amount: number;
  paid_amount: number;
  remaining_balance: number;
  discount_amount: number;
  discount_reason?: string;
  total_amount?: number;
  total_payable?: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  due_date?: number;
  last_payment_date?: number;
  last_payment_amount?: number;
  collected_by?: string;
  payment_method?: string;
  billing_period_start?: number;
  billing_period_end?: number;
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateInvoiceInput {
  invoice_number?: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  package: string;
  amount: number;
  paid_amount?: number;
  remaining_balance?: number;
  discount_amount?: number;
  status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  due_date?: number;
  created_at: number;
  created_by?: string;
}

export interface UpdateInvoiceInput {
  customer_name?: string;
  customer_phone?: string;
  package?: string;
  amount?: number;
  paid_amount?: number;
  remaining_balance?: number;
  discount_amount?: number;
  status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  due_date?: number;
  last_payment_date?: number;
  last_payment_amount?: number;
  collected_by?: string;
  updated_at: number;
  updated_by?: string;
}

export class InvoicesRepository extends BaseRepository<Invoice> {
  constructor() {
    super('invoices');
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.findOne({ invoice_number: invoiceNumber });
  }

  async findByCustomerId(customerId: string): Promise<Invoice[]> {
    return this.findMany({ customer_id: customerId });
  }

  async findByStatus(status: 'unpaid' | 'partial' | 'paid' | 'overdue'): Promise<Invoice[]> {
    return this.findMany({ status });
  }

  async findByCollectedBy(staffId: string): Promise<Invoice[]> {
    return this.findMany({ collected_by: staffId });
  }

  async searchInvoices(searchTerm: string): Promise<Invoice[]> {
    return this.search(searchTerm, ['customer_name', 'invoice_number']);
  }

  async paginateInvoices(
    params: PaginationParams & {
      customer_id?: string;
      status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
      search?: string;
    }
  ): Promise<PaginatedResult<Invoice>> {
    const { customer_id, status, search, page, limit } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      // Supabase doesn't support OR with ILIKE directly, so we'll use a simple filter
      query = query.ilike('customer_name', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data as Invoice[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    return this.create(data);
  }

  async updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice | null> {
    return this.update(id, data);
  }

  async deleteInvoice(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByStatus(status: 'unpaid' | 'partial' | 'paid' | 'overdue'): Promise<number> {
    return this.count({ status });
  }

  async countByCustomerId(customerId: string): Promise<number> {
    return this.count({ customer_id: customerId });
  }

  async sumPaidAmount(): Promise<number> {
    return this.sum('paid_amount');
  }

  async sumAmount(): Promise<number> {
    return this.sum('amount');
  }

  async sumRemainingBalance(): Promise<number> {
    return this.sum('remaining_balance');
  }

  async sumPaidAmountByCustomerId(customerId: string): Promise<number> {
    return this.sum('paid_amount', { customer_id: customerId });
  }

  async sumPaidAmountByStatus(status: 'unpaid' | 'partial' | 'paid' | 'overdue'): Promise<number> {
    return this.sum('paid_amount', { status });
  }

  async findOverdueInvoices(): Promise<Invoice[]> {
    const now = Date.now();
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', 'unpaid')
      .not('due_date', 'is', null)
      .lt('due_date', now);
    
    if (error) throw error;
    return data as Invoice[];
  }

  async findInvoicesByDateRange(startDate: number, endDate: number): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Invoice[];
  }

  async markAsOverdue(invoiceId: string): Promise<Invoice | null> {
    return this.update(invoiceId, { 
      status: 'overdue', 
      updated_at: Date.now() 
    } as UpdateInvoiceInput);
  }
}

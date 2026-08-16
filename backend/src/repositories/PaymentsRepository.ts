import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Payment {
  id: string;
  customer_id: string;
  customer_name: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  approval_status: 'pending' | 'approved' | 'rejected';
  discount_amount: number;
  discount_reason?: string;
  notes?: string;
  collected_by?: string;
  received_by?: string;
  approved_by?: string;
  approved_at?: number;
  rejected_by?: string;
  rejected_at?: number;
  rejection_reason?: string;
  created_at: number;
  created_by?: string;
}

export interface CreatePaymentInput {
  customer_id: string;
  customer_name: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  approval_status?: 'pending' | 'approved' | 'rejected';
  discount_amount?: number;
  discount_reason?: string;
  notes?: string;
  collected_by?: string;
  received_by?: string;
  created_at: number;
  created_by?: string;
}

export interface UpdatePaymentInput {
  amount?: number;
  payment_method?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  approval_status?: 'pending' | 'approved' | 'rejected';
  discount_amount?: number;
  discount_reason?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: number;
  rejected_by?: string;
  rejected_at?: number;
  rejection_reason?: string;
}

export class PaymentsRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }

  async findByCustomerId(customerId: string): Promise<Payment[]> {
    return this.findMany({ customer_id: customerId });
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return this.findMany({ invoice_id: invoiceId });
  }

  async findByStatus(status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<Payment[]> {
    return this.findMany({ status });
  }

  async findByApprovalStatus(approvalStatus: 'pending' | 'approved' | 'rejected'): Promise<Payment[]> {
    return this.findMany({ approval_status: approvalStatus });
  }

  async findByCollectedBy(staffId: string): Promise<Payment[]> {
    return this.findMany({ collected_by: staffId });
  }

  async searchPayments(searchTerm: string): Promise<Payment[]> {
    return this.search(searchTerm, ['customer_name', 'payment_method', 'discount_reason', 'notes']);
  }

  async paginatePayments(
    params: PaginationParams & {
      customer_id?: string;
      invoice_id?: string;
      status?: 'pending' | 'completed' | 'failed' | 'refunded';
      approval_status?: 'pending' | 'approved' | 'rejected';
      search?: string;
    }
  ): Promise<PaginatedResult<Payment>> {
    const { customer_id, invoice_id, status, approval_status, search, page, limit } = params;
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
    if (invoice_id) {
      query = query.eq('invoice_id', invoice_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (approval_status) {
      query = query.eq('approval_status', approval_status);
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
      data: data as Payment[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createPayment(data: CreatePaymentInput): Promise<Payment> {
    return this.create(data);
  }

  async updatePayment(id: string, data: UpdatePaymentInput): Promise<Payment | null> {
    return this.update(id, data);
  }

  async deletePayment(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByStatus(status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<number> {
    return this.count({ status });
  }

  async countByApprovalStatus(approvalStatus: 'pending' | 'approved' | 'rejected'): Promise<number> {
    return this.count({ approval_status: approvalStatus });
  }

  async sumAmount(): Promise<number> {
    return this.sum('amount');
  }

  async sumAmountByCustomerId(customerId: string): Promise<number> {
    return this.sum('amount', { customer_id: customerId });
  }

  async sumAmountByCollectedBy(staffId: string): Promise<number> {
    return this.sum('amount', { collected_by: staffId });
  }
}

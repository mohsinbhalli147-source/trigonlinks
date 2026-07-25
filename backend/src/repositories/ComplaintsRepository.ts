import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Complaint {
  id: string;
  customer_id: string;
  customer_name: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: number;
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateComplaintInput {
  customer_id: string;
  customer_name: string;
  category: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  created_at: number;
  created_by?: string;
}

export interface UpdateComplaintInput {
  category?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: number;
  updated_at: number;
  updated_by?: string;
}

export class ComplaintsRepository extends BaseRepository<Complaint> {
  constructor() {
    super('complaints');
  }

  async findByCustomerId(customerId: string): Promise<Complaint[]> {
    return this.findMany({ customer_id: customerId });
  }

  async findByStatus(status: 'pending' | 'in-progress' | 'resolved' | 'rejected'): Promise<Complaint[]> {
    return this.findMany({ status });
  }

  async findByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<Complaint[]> {
    return this.findMany({ priority });
  }

  async findByCategory(category: string): Promise<Complaint[]> {
    return this.findMany({ category });
  }

  async searchComplaints(searchTerm: string): Promise<Complaint[]> {
    return this.search(searchTerm, ['customer_name', 'category', 'description']);
  }

  async paginateComplaints(
    params: PaginationParams & {
      customer_id?: string;
      status?: 'pending' | 'in-progress' | 'resolved' | 'rejected';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      search?: string;
    }
  ): Promise<PaginatedResult<Complaint>> {
    const { customer_id, status, priority, search, page, limit } = params;
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
    if (priority) {
      query = query.eq('priority', priority);
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
      data: data as Complaint[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createComplaint(data: CreateComplaintInput): Promise<Complaint> {
    return this.create(data);
  }

  async updateComplaint(id: string, data: UpdateComplaintInput): Promise<Complaint | null> {
    return this.update(id, data);
  }

  async deleteComplaint(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByStatus(status: 'pending' | 'in-progress' | 'resolved' | 'rejected'): Promise<number> {
    return this.count({ status });
  }

  async countByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<number> {
    return this.count({ priority });
  }

  async countByCustomerId(customerId: string): Promise<number> {
    return this.count({ customer_id: customerId });
  }
}

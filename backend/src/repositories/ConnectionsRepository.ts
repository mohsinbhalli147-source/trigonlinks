import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Connection {
  id: string;
  customer_id?: string;
  customer_name: string;
  father_name?: string;
  phone?: string;
  cnic?: string;
  address?: string;
  package: string;
  area: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive';
  assigned_staff?: string;
  technician_id?: string;
  installation_date?: number;
  billing_date?: string;
  connection_fee?: number;
  monthly_fee?: number;
  concession?: number;
  concession_reason?: string;
  expenses?: Array<{
    amount: number;
    category: string;
    description: string;
    inventoryItems: string;
  }>;
  notes?: string;
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
  rejection_reason?: string;
}

export interface CreateConnectionInput {
  customer_name: string;
  father_name?: string;
  phone?: string;
  cnic?: string;
  address?: string;
  package: string;
  area: string;
  status?: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive';
  installation_date?: number;
  billing_date?: string;
  connection_fee?: number;
  monthly_fee?: number;
  concession?: number;
  concession_reason?: string;
  expenses?: Array<{
    amount: number;
    category: string;
    description: string;
    inventoryItems: string;
  }>;
  notes?: string;
  created_at: number;
  created_by?: string;
}

export interface UpdateConnectionInput {
  customer_name?: string;
  father_name?: string;
  phone?: string;
  cnic?: string;
  address?: string;
  package?: string;
  area?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive';
  assigned_staff?: string;
  technician_id?: string;
  installation_date?: number;
  billing_date?: string;
  connection_fee?: number;
  monthly_fee?: number;
  concession?: number;
  concession_reason?: string;
  expenses?: Array<{
    amount: number;
    category: string;
    description: string;
    inventoryItems: string;
  }>;
  notes?: string;
  rejection_reason?: string;
  updated_at: number;
  updated_by?: string;
}

export class ConnectionsRepository extends BaseRepository<Connection> {
  constructor() {
    super('connections');
  }

  async findByCustomerId(customerId: string): Promise<Connection[]> {
    return this.findMany({ customer_id: customerId });
  }

  async findByArea(area: string): Promise<Connection[]> {
    return this.findMany({ area });
  }

  async findByStatus(status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive'): Promise<Connection[]> {
    return this.findMany({ status });
  }

  async findByAssignedStaff(staffId: string): Promise<Connection[]> {
    return this.findMany({ assigned_staff: staffId });
  }

  async searchConnections(searchTerm: string): Promise<Connection[]> {
    return this.search(searchTerm, ['customer_name', 'package', 'area']);
  }

  async paginateConnections(
    params: PaginationParams & {
      area?: string;
      status?: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive';
      search?: string;
    }
  ): Promise<PaginatedResult<Connection>> {
    const { area, status, search, page, limit } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (area) {
      query = query.eq('area', area);
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
      data: data as Connection[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createConnection(data: CreateConnectionInput): Promise<Connection> {
    return this.create(data);
  }

  async updateConnection(id: string, data: UpdateConnectionInput): Promise<Connection | null> {
    return this.update(id, data);
  }

  async deleteConnection(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByStatus(status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive'): Promise<number> {
    return this.count({ status });
  }

  async countByArea(area: string): Promise<number> {
    return this.count({ area });
  }

  async countByAssignedStaff(staffId: string): Promise<number> {
    return this.count({ assigned_staff: staffId });
  }
}

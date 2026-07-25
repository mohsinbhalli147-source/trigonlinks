import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Staff {
  id: string;
  uid: string;
  name: string;
  username: string;
  password_hash: string;
  phone?: string;
  email?: string;
  role: 'admin' | 'staff' | 'customer' | 'manager' | 'technician' | 'collector' | 'sales' | 'support';
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  assigned_area?: string;
  permissions: Record<string, boolean>;
  rating: number;
  salary?: number;
  hire_date?: number;
  address?: string;
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateStaffInput {
  uid: string;
  name: string;
  username: string;
  password_hash: string;
  phone?: string;
  email?: string;
  role: 'admin' | 'staff' | 'customer' | 'manager' | 'technician' | 'collector' | 'sales' | 'support';
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  assigned_area?: string;
  permissions?: Record<string, boolean>;
  rating?: number;
  salary?: number;
  hire_date?: number;
  address?: string;
  created_at: number;
  created_by?: string;
}

export interface UpdateStaffInput {
  name?: string;
  username?: string;
  password_hash?: string;
  phone?: string;
  email?: string;
  role?: 'admin' | 'staff' | 'customer' | 'manager' | 'technician' | 'collector' | 'sales' | 'support';
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  assigned_area?: string;
  permissions?: Record<string, boolean>;
  rating?: number;
  salary?: number;
  hire_date?: number;
  address?: string;
  updated_at: number;
  updated_by?: string;
}

export class StaffRepository extends BaseRepository<Staff> {
  constructor() {
    super('staff');
  }

  async findByUsername(username: string): Promise<Staff | null> {
    return this.findOne({ username });
  }

  async findByRole(role: 'admin' | 'staff' | 'customer'): Promise<Staff[]> {
    return this.findMany({ role });
  }

  async findByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<Staff[]> {
    return this.findMany({ status });
  }

  async findByAssignedArea(area: string): Promise<Staff[]> {
    return this.findMany({ assigned_area: area });
  }

  async searchStaff(searchTerm: string): Promise<Staff[]> {
    return this.search(searchTerm, ['name', 'username', 'phone', 'email']);
  }

  async paginateStaff(
    params: PaginationParams & {
      role?: 'admin' | 'staff' | 'customer';
      status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
      search?: string;
    }
  ): Promise<PaginatedResult<Staff>> {
    const { role, status, search, page, limit } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      // Supabase doesn't support OR with ILIKE directly, so we'll use a simple filter
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data as Staff[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createStaff(data: CreateStaffInput): Promise<Staff> {
    return this.create(data);
  }

  async updateStaff(id: string, data: UpdateStaffInput): Promise<Staff | null> {
    return this.update(id, data);
  }

  async deleteStaff(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByRole(role: 'admin' | 'staff' | 'customer'): Promise<number> {
    return this.count({ role });
  }

  async countByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<number> {
    return this.count({ status });
  }

  async countByAssignedArea(area: string): Promise<number> {
    return this.count({ assigned_area: area });
  }
}

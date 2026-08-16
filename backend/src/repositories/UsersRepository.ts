import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface User {
  id: string;
  uid: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
  phone?: string;
  address?: string;
  assigned_area?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: number;
  updated_at: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateUserInput {
  uid: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
  phone?: string;
  address?: string;
  assigned_area?: string;
  is_active?: boolean;
  email_verified?: boolean;
  created_at: number;
  updated_at: number;
  created_by?: string;
}

export interface UpdateUserInput {
  email?: string;
  password_hash?: string;
  name?: string;
  role?: 'admin' | 'staff' | 'customer';
  phone?: string;
  address?: string;
  assigned_area?: string;
  is_active?: boolean;
  updated_at: number;
  updated_by?: string;
}

export class UsersRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByUid(uid: string): Promise<User | null> {
    return this.findOne({ uid });
  }

  async findByRole(role: 'admin' | 'staff' | 'customer'): Promise<User[]> {
    return this.findMany({ role });
  }

  async findByStatus(isActive: boolean): Promise<User[]> {
    return this.findMany({ is_active: isActive });
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    return this.search(searchTerm, ['name', 'email', 'phone']);
  }

  async paginateUsers(
    params: PaginationParams & {
      role?: 'admin' | 'staff' | 'customer';
      status?: 'active' | 'inactive';
      search?: string;
    }
  ): Promise<PaginatedResult<User>> {
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
    if (status !== undefined) {
      query = query.eq('is_active', status === 'active');
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
      data: data as User[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createWithUid(data: CreateUserInput): Promise<User> {
    return this.create(data);
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User | null> {
    return this.update(id, data);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByRole(role: 'admin' | 'staff' | 'customer'): Promise<number> {
    return this.count({ role });
  }

  async countByStatus(isActive: boolean): Promise<number> {
    return this.count({ is_active: isActive });
  }
}

import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Package {
  id: string;
  name: string;
  speed: string;
  price: number;
  description?: string;
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreatePackageInput {
  name: string;
  speed: string;
  price: number;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  created_at: number;
  created_by?: string;
}

export interface UpdatePackageInput {
  name?: string;
  speed?: string;
  price?: number;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  updated_at: number;
  updated_by?: string;
}

export class PackagesRepository extends BaseRepository<Package> {
  constructor() {
    super('packages');
  }

  async findByName(name: string): Promise<Package | null> {
    return this.findOne({ name });
  }

  async findByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<Package[]> {
    return this.findMany({ status });
  }

  async searchPackages(searchTerm: string): Promise<Package[]> {
    return this.search(searchTerm, ['name', 'speed', 'description']);
  }

  async paginatePackages(
    params: PaginationParams & {
      status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
      search?: string;
    }
  ): Promise<PaginatedResult<Package>> {
    const { status, search, page, limit } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

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
      data: data as Package[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createPackage(data: CreatePackageInput): Promise<Package> {
    return this.create(data);
  }

  async updatePackage(id: string, data: UpdatePackageInput): Promise<Package | null> {
    return this.update(id, data);
  }

  async deletePackage(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<number> {
    return this.count({ status });
  }
}

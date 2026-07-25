import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Area {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateAreaInput {
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  created_at: number;
  created_by?: string;
}

export interface UpdateAreaInput {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  updated_at: number;
  updated_by?: string;
}

export class AreasRepository extends BaseRepository<Area> {
  constructor() {
    super('areas');
  }

  async findByName(name: string): Promise<Area | null> {
    return this.findOne({ name });
  }

  async findByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<Area[]> {
    return this.findMany({ status });
  }

  async searchAreas(searchTerm: string): Promise<Area[]> {
    return this.search(searchTerm, ['name', 'description']);
  }

  async paginateAreas(
    params: PaginationParams & {
      status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
      search?: string;
    }
  ): Promise<PaginatedResult<Area>> {
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
      data: data as Area[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createArea(data: CreateAreaInput): Promise<Area> {
    return this.create(data);
  }

  async updateArea(id: string, data: UpdateAreaInput): Promise<Area | null> {
    return this.update(id, data);
  }

  async deleteArea(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<number> {
    return this.count({ status });
  }
}

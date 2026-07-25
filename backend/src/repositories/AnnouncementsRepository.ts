import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target: string;
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  message: string;
  target: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  created_at: number;
  created_by?: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  message?: string;
  target?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  updated_at: number;
  updated_by?: string;
}

export class AnnouncementsRepository extends BaseRepository<Announcement> {
  constructor() {
    super('announcements');
  }

  async findByTarget(target: string): Promise<Announcement[]> {
    return this.findMany({ target });
  }

  async findByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<Announcement[]> {
    return this.findMany({ status });
  }

  async findActiveAnnouncements(): Promise<Announcement[]> {
    return this.findMany({ status: 'active' });
  }

  async searchAnnouncements(searchTerm: string): Promise<Announcement[]> {
    return this.search(searchTerm, ['title', 'message']);
  }

  async paginateAnnouncements(
    params: PaginationParams & {
      status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
      target?: string;
      search?: string;
    }
  ): Promise<PaginatedResult<Announcement>> {
    const { status, target, search, page, limit } = params;
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
    if (target) {
      query = query.eq('target', target);
    }
    if (search) {
      // Supabase doesn't support OR with ILIKE directly, so we'll use a simple filter
      query = query.ilike('title', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data as Announcement[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createAnnouncement(data: CreateAnnouncementInput): Promise<Announcement> {
    return this.create(data);
  }

  async updateAnnouncement(id: string, data: UpdateAnnouncementInput): Promise<Announcement | null> {
    return this.update(id, data);
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<number> {
    return this.count({ status });
  }

  async countByTarget(target: string): Promise<number> {
    return this.count({ target });
  }
}

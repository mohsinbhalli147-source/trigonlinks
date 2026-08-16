import { getSupabaseClient } from '../database/client';
import { logger } from '../utils/logger';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryOptions {
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  offset?: number;
  limit?: number;
}

export abstract class BaseRepository<T> {
  protected tableName: string;
  protected supabase = getSupabaseClient();

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public async findAll(options?: QueryOptions): Promise<T[]> {
    const { orderBy = 'created_at', orderDirection = 'DESC', limit } = options || {};
    
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .order(orderBy, { ascending: orderDirection === 'ASC' });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) {
      logger.error('FindAll error:', error);
      throw error;
    }
    
    return data as T[];
  }

  public async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .limit(1);
    
    if (error) {
      logger.error('FindById error:', error);
      throw error;
    }
    
    return data && data.length > 0 ? data[0] as T : null;
  }

  public async findByUid(uid: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('uid', uid)
      .limit(1);
    
    if (error) {
      logger.error('FindByUid error:', error);
      throw error;
    }
    
    return data && data.length > 0 ? data[0] as T : null;
  }

  public async findOne(conditions: Record<string, any>): Promise<T | null> {
    let query = this.supabase
      .from(this.tableName)
      .select('*');
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    query = query.limit(1);
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('FindOne error:', error);
      throw error;
    }
    
    return data && data.length > 0 ? data[0] as T : null;
  }

  public async findMany(conditions: Record<string, any>, options?: QueryOptions): Promise<T[]> {
    const { orderBy = 'created_at', orderDirection = 'DESC', limit } = options || {};
    
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .order(orderBy, { ascending: orderDirection === 'ASC' });
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('FindMany error:', error);
      throw error;
    }
    
    return data as T[];
  }

  public async search(searchTerm: string, searchFields: string[], options?: QueryOptions): Promise<T[]> {
    const { orderBy = 'created_at', orderDirection = 'DESC', limit } = options || {};
    
    // Supabase doesn't support ILIKE directly, use text search or filter
    // For now, we'll use a simple approach with filter
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .order(orderBy, { ascending: orderDirection === 'DESC' });
    
    // Apply search filter on first field (simplified)
    if (searchFields.length > 0) {
      query = query.ilike(searchFields[0], `%${searchTerm}%`);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Search error:', error);
      throw error;
    }
    
    return data as T[];
  }

  protected async count(conditions?: Record<string, any>): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    
    if (conditions) {
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { count, error } = await query;
    
    if (error) {
      logger.error('Count error:', error);
      throw error;
    }
    
    return count || 0;
  }

  protected async create(data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data as any)
      .select()
      .limit(1);
    
    if (error) {
      logger.error('Create error:', error);
      throw error;
    }
    
    return result![0] as T;
  }

  protected async update(id: string, data: Partial<T>): Promise<T | null> {
    console.log(`BaseRepository.update: Updating ${this.tableName} with id=${id}`, data);
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(data as any)
      .eq('id', id)
      .select()
      .limit(1);
    
    if (error) {
      console.error(`BaseRepository.update error for ${this.tableName}:`, error);
      logger.error('Update error:', error);
      throw error;
    }
    
    console.log(`BaseRepository.update: Successfully updated ${this.tableName} with id=${id}`);
    return result && result.length > 0 ? result[0] as T : null;
  }

  protected async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Delete error:', error);
      throw error;
    }
    
    return true;
  }

  protected async paginate(
    conditions: Record<string, any> = {},
    options: QueryOptions & PaginationParams
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order(orderBy, { ascending: orderDirection === 'ASC' })
      .range(from, to);
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, count, error } = await query;
    
    if (error) {
      logger.error('Paginate error:', error);
      throw error;
    }
    
    return {
      data: data as T[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  protected async executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    // Supabase doesn't support manual transactions in the same way
    // For now, we'll execute the callback directly
    // In production, you'd use Supabase RPC functions for complex transactions
    logger.warn('Transaction support limited with Supabase client');
    return callback(this.supabase);
  }

  protected async sum(field: string, conditions?: Record<string, any>): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select(field);
    
    if (conditions) {
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Sum error:', error);
      throw error;
    }
    
    const sum = data.reduce((acc: number, row: any) => acc + (parseFloat(row[field]) || 0), 0);
    return sum;
  }
}

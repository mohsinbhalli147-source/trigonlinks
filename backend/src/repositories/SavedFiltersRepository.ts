import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface SavedFilter {
  id: string;
  user_id: string;
  filter_name: string;
  filter_type: string;
  filter_config: any;
  is_default: boolean;
  created_at: number;
  updated_at: number | null;
}

export class SavedFiltersRepository extends BaseRepository<SavedFilter> {
  constructor() {
    super('saved_filters');
  }

  async findByUserId(userId: string): Promise<SavedFilter[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByType(userId: string, filterType: string): Promise<SavedFilter[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', userId)
      .eq('filter_type', filterType)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findDefault(userId: string, filterType: string): Promise<SavedFilter | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', userId)
      .eq('filter_type', filterType)
      .eq('is_default', true)
      .single();

    if (error) return null;
    return data;
  }

  async createFilter(filter: Omit<SavedFilter, 'id' | 'created_at' | 'updated_at'>): Promise<SavedFilter> {
    const supabase = getSupabaseClient();
    
    // If this is set as default, remove default from other filters of same type
    if (filter.is_default) {
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('user_id', filter.user_id)
        .eq('filter_type', filter.filter_type);
    }

    const { data, error } = await supabase
      .from('saved_filters')
      .insert({
        ...filter,
        created_at: Date.now(),
        updated_at: null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFilter(id: string, updates: Partial<SavedFilter>): Promise<SavedFilter> {
    const supabase = getSupabaseClient();
    
    // If setting as default, remove default from other filters
    if (updates.is_default) {
      const existing = await this.findById(id);
      if (existing) {
        await supabase
          .from('saved_filters')
          .update({ is_default: false })
          .eq('user_id', existing.user_id)
          .eq('filter_type', existing.filter_type)
          .neq('id', id);
      }
    }

    const { data, error } = await supabase
      .from('saved_filters')
      .update({
        ...updates,
        updated_at: Date.now()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async setDefault(id: string): Promise<SavedFilter> {
    return this.updateFilter(id, { is_default: true });
  }

  async deleteFilter(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByUserId(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}

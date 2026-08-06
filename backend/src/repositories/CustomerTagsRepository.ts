import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface CustomerTag {
  id: string;
  customer_id: string;
  tag_name: string;
  tag_color: string;
  created_at: number;
  created_by: string | null;
}

export class CustomerTagsRepository extends BaseRepository<CustomerTag> {
  constructor() {
    super('customer_tags');
  }

  async findByCustomerId(customerId: string): Promise<CustomerTag[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_tags')
      .select('*')
      .eq('customer_id', customerId);

    if (error) throw error;
    return data || [];
  }

  async findByTagName(tagName: string): Promise<CustomerTag[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_tags')
      .select('*')
      .eq('tag_name', tagName);

    if (error) throw error;
    return data || [];
  }

  async upsertTag(customerId: string, tagName: string, tagColor: string, createdBy: string): Promise<CustomerTag> {
    const supabase = getSupabaseClient();
    
    // Check if tag already exists
    const { data: existing } = await supabase
      .from('customer_tags')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tag_name', tagName)
      .single();

    if (existing) {
      // Update existing tag
      const { data, error } = await supabase
        .from('customer_tags')
        .update({ tag_color: tagColor })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new tag
      const { data, error } = await supabase
        .from('customer_tags')
        .insert({
          customer_id: customerId,
          tag_name: tagName,
          tag_color: tagColor,
          created_by: createdBy,
          created_at: Date.now()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_tags')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }

  async deleteTag(customerId: string, tagName: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_tags')
      .delete()
      .eq('customer_id', customerId)
      .eq('tag_name', tagName);

    if (error) throw error;
  }

  async getAllTags(): Promise<string[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_tags')
      .select('tag_name');

    if (error) throw error;
    
    // Get unique tag names
    const uniqueTags = [...new Set(data?.map(t => t.tag_name) || [])];
    return uniqueTags;
  }
}

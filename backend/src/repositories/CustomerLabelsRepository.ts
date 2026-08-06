import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface CustomerLabel {
  id: string;
  customer_id: string;
  label_name: string;
  label_type: string;
  label_color: string;
  created_at: number;
  created_by: string | null;
}

export class CustomerLabelsRepository extends BaseRepository<CustomerLabel> {
  constructor() {
    super('customer_labels');
  }

  async findByCustomerId(customerId: string): Promise<CustomerLabel[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_labels')
      .select('*')
      .eq('customer_id', customerId);

    if (error) throw error;
    return data || [];
  }

  async findByType(labelType: string): Promise<CustomerLabel[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_labels')
      .select('*')
      .eq('label_type', labelType);

    if (error) throw error;
    return data || [];
  }

  async upsertLabel(customerId: string, labelName: string, labelType: string, labelColor: string, createdBy: string): Promise<CustomerLabel> {
    const supabase = getSupabaseClient();
    
    const { data: existing } = await supabase
      .from('customer_labels')
      .select('*')
      .eq('customer_id', customerId)
      .eq('label_name', labelName)
      .eq('label_type', labelType)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('customer_labels')
        .update({ label_color: labelColor })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('customer_labels')
        .insert({
          customer_id: customerId,
          label_name: labelName,
          label_type: labelType,
          label_color: labelColor,
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
      .from('customer_labels')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }

  async deleteLabel(customerId: string, labelName: string, labelType: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_labels')
      .delete()
      .eq('customer_id', customerId)
      .eq('label_name', labelName)
      .eq('label_type', labelType);

    if (error) throw error;
  }
}

import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface CustomerNote {
  id: string;
  customer_id: string;
  note_text: string;
  note_type: string;
  is_pinned: boolean;
  created_at: number;
  created_by: string | null;
  updated_at: number | null;
  updated_by: string | null;
}

export class CustomerNotesRepository extends BaseRepository<CustomerNote> {
  constructor() {
    super('customer_notes');
  }

  async findByCustomerId(customerId: string): Promise<CustomerNote[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findPinned(customerId: string): Promise<CustomerNote[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_pinned', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByType(customerId: string, noteType: string): Promise<CustomerNote[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .eq('note_type', noteType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createNote(note: Omit<CustomerNote, 'id' | 'created_at' | 'updated_at' | 'updated_by'>): Promise<CustomerNote> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_notes')
      .insert({
        ...note,
        created_at: Date.now(),
        updated_at: null,
        updated_by: null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNote(id: string, updates: Partial<Omit<CustomerNote, 'id' | 'created_at'>>): Promise<CustomerNote> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_notes')
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

  async togglePin(id: string, isPinned: boolean): Promise<CustomerNote> {
    return this.updateNote(id, { is_pinned: isPinned });
  }

  async deleteNote(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_notes')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }
}

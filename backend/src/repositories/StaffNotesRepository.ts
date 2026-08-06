import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface StaffNote {
  id: string;
  customer_id: string;
  note_text: string;
  note_category: string;
  is_sensitive: boolean;
  created_at: number;
  created_by: string | null;
  updated_at: number | null;
  updated_by: string | null;
  visible_to_roles: string[];
}

export class StaffNotesRepository extends BaseRepository<StaffNote> {
  constructor() {
    super('staff_notes');
  }

  async findByCustomerId(customerId: string): Promise<StaffNote[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('staff_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByCategory(customerId: string, category: string): Promise<StaffNote[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('staff_notes')
      .select('*')
      .eq('customer_id', customerId)
      .eq('note_category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByCreatedBy(createdBy: string): Promise<StaffNote[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('staff_notes')
      .select('*')
      .eq('created_by', createdBy)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findSensitive(customerId: string): Promise<StaffNote[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('staff_notes')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_sensitive', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createNote(note: Omit<StaffNote, 'id' | 'created_at' | 'updated_at' | 'updated_by'>): Promise<StaffNote> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('staff_notes')
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

  async updateNote(id: string, updates: Partial<Omit<StaffNote, 'id' | 'created_at'>>): Promise<StaffNote> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('staff_notes')
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

  async deleteNote(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('staff_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('staff_notes')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }
}

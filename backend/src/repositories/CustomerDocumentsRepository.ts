import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface CustomerDocument {
  id: string;
  customer_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  uploaded_at: number;
  uploaded_by: string | null;
  is_public: boolean;
}

export class CustomerDocumentsRepository extends BaseRepository<CustomerDocument> {
  constructor() {
    super('customer_documents');
  }

  async findByCustomerId(customerId: string): Promise<CustomerDocument[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByType(customerId: string, documentType: string): Promise<CustomerDocument[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .eq('document_type', documentType)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findPublic(customerId: string): Promise<CustomerDocument[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_public', true)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createDocument(document: Omit<CustomerDocument, 'id' | 'uploaded_at'>): Promise<CustomerDocument> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_documents')
      .insert({
        ...document,
        uploaded_at: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDocument(id: string, updates: Partial<CustomerDocument>): Promise<CustomerDocument> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDocument(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_documents')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }
}

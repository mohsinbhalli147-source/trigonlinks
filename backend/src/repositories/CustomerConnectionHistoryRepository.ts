import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface CustomerConnectionHistory {
  id: string;
  customer_id: string;
  connection_id: string;
  old_status: string | null;
  new_status: string;
  change_reason: string | null;
  changed_at: number;
  changed_by: string | null;
}

export class CustomerConnectionHistoryRepository extends BaseRepository<CustomerConnectionHistory> {
  constructor() {
    super('customer_connection_history');
  }

  async findByCustomerId(customerId: string, limit: number = 50): Promise<CustomerConnectionHistory[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_connection_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findByConnectionId(connectionId: string, limit: number = 50): Promise<CustomerConnectionHistory[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_connection_history')
      .select('*')
      .eq('connection_id', connectionId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async createHistory(history: Omit<CustomerConnectionHistory, 'id' | 'changed_at'>): Promise<CustomerConnectionHistory> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_connection_history')
      .insert({
        ...history,
        changed_at: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async logStatusChange(
    customerId: string,
    connectionId: string,
    oldStatus: string | null,
    newStatus: string,
    changeReason: string | null = null,
    changedBy: string | null = null
  ): Promise<CustomerConnectionHistory> {
    return this.createHistory({
      customer_id: customerId,
      connection_id: connectionId,
      old_status: oldStatus,
      new_status: newStatus,
      change_reason: changeReason,
      changed_by: changedBy
    });
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_connection_history')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }

  async deleteByConnectionId(connectionId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_connection_history')
      .delete()
      .eq('connection_id', connectionId);

    if (error) throw error;
  }
}

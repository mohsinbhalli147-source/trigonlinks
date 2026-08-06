import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface CustomerPackageHistory {
  id: string;
  customer_id: string;
  connection_id: string | null;
  old_package_id: string | null;
  new_package_id: string | null;
  change_reason: string | null;
  changed_at: number;
  changed_by: string | null;
}

export class CustomerPackageHistoryRepository extends BaseRepository<CustomerPackageHistory> {
  constructor() {
    super('customer_package_history');
  }

  async findByCustomerId(customerId: string, limit: number = 50): Promise<CustomerPackageHistory[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_package_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findByConnectionId(connectionId: string, limit: number = 50): Promise<CustomerPackageHistory[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_package_history')
      .select('*')
      .eq('connection_id', connectionId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async createHistory(history: Omit<CustomerPackageHistory, 'id' | 'changed_at'>): Promise<CustomerPackageHistory> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_package_history')
      .insert({
        ...history,
        changed_at: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async logPackageChange(
    customerId: string,
    connectionId: string | null,
    oldPackageId: string | null,
    newPackageId: string | null,
    changeReason: string | null = null,
    changedBy: string | null = null
  ): Promise<CustomerPackageHistory> {
    return this.createHistory({
      customer_id: customerId,
      connection_id: connectionId,
      old_package_id: oldPackageId,
      new_package_id: newPackageId,
      change_reason: changeReason,
      changed_by: changedBy
    });
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_package_history')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }
}

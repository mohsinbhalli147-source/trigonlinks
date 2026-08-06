import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface CustomerActivity {
  id: string;
  customer_id: string;
  activity_type: string;
  activity_title: string;
  activity_description: string | null;
  metadata: any;
  created_at: number;
  created_by: string | null;
}

export class CustomerActivityTimelineRepository extends BaseRepository<CustomerActivity> {
  constructor() {
    super('customer_activity_timeline');
  }

  async findByCustomerId(customerId: string, limit: number = 50): Promise<CustomerActivity[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_activity_timeline')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findByType(customerId: string, activityType: string, limit: number = 50): Promise<CustomerActivity[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_activity_timeline')
      .select('*')
      .eq('customer_id', customerId)
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findByDateRange(customerId: string, startDate: number, endDate: number): Promise<CustomerActivity[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_activity_timeline')
      .select('*')
      .eq('customer_id', customerId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createActivity(activity: Omit<CustomerActivity, 'id' | 'created_at'>): Promise<CustomerActivity> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_activity_timeline')
      .insert({
        ...activity,
        created_at: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async logActivity(
    customerId: string,
    activityType: string,
    activityTitle: string,
    activityDescription: string | null = null,
    metadata: any = null,
    createdBy: string | null = null
  ): Promise<CustomerActivity> {
    return this.createActivity({
      customer_id: customerId,
      activity_type: activityType,
      activity_title: activityTitle,
      activity_description: activityDescription,
      metadata: metadata,
      created_by: createdBy
    });
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('customer_activity_timeline')
      .delete()
      .eq('customer_id', customerId);

    if (error) throw error;
  }

  async getRecentActivities(limit: number = 100): Promise<CustomerActivity[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_activity_timeline')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

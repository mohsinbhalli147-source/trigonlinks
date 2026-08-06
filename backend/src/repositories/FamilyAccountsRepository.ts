import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface FamilyAccount {
  id: string;
  family_name: string;
  primary_customer_id: string | null;
  billing_type: string;
  created_at: number;
  created_by: string | null;
}

export interface FamilyMember {
  id: string;
  family_account_id: string;
  customer_id: string;
  relationship: string;
  is_billing_contact: boolean;
  joined_at: number;
}

export class FamilyAccountsRepository extends BaseRepository<FamilyAccount> {
  constructor() {
    super('family_accounts');
  }

  async findByPrimaryCustomerId(primaryCustomerId: string): Promise<FamilyAccount[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('family_accounts')
      .select('*')
      .eq('primary_customer_id', primaryCustomerId);

    if (error) throw error;
    return data || [];
  }

  async createAccount(account: Omit<FamilyAccount, 'id' | 'created_at'>): Promise<FamilyAccount> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('family_accounts')
      .insert({
        ...account,
        created_at: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAccount(id: string, updates: Partial<FamilyAccount>): Promise<FamilyAccount> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('family_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAccount(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('family_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getMembers(familyAccountId: string): Promise<FamilyMember[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_account_id', familyAccountId);

    if (error) throw error;
    return data || [];
  }

  async addMember(member: Omit<FamilyMember, 'id' | 'joined_at'>): Promise<FamilyMember> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        ...member,
        joined_at: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeMember(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async findByCustomerId(customerId: string): Promise<FamilyAccount | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('family_members')
      .select('family_accounts(*)')
      .eq('customer_id', customerId);

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const familyAccount = data[0]?.family_accounts;
    return Array.isArray(familyAccount) && familyAccount.length > 0 
      ? familyAccount[0] as FamilyAccount 
      : null;
  }
}

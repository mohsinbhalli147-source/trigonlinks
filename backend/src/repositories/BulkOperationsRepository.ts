import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';
import { getSupabaseClient } from '../database/client';

export interface BulkOperation {
  id: string;
  operation_type: string;
  operation_config: any;
  target_customer_ids: string[];
  status: string;
  total_count: number;
  success_count: number;
  failure_count: number;
  started_at: number | null;
  completed_at: number | null;
  created_by: string | null;
  created_at: number;
  error_details: any;
}

export interface BulkOperationResult {
  id: string;
  bulk_operation_id: string;
  customer_id: string | null;
  status: string;
  error_message?: string | null;
  processed_at: number;
}

export class BulkOperationsRepository extends BaseRepository<BulkOperation> {
  constructor() {
    super('bulk_operations');
  }

  async findByCreatedBy(createdBy: string): Promise<BulkOperation[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('created_by', createdBy)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByStatus(status: string): Promise<BulkOperation[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByType(operationType: string): Promise<BulkOperation[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('operation_type', operationType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createOperation(operation: Omit<BulkOperation, 'id' | 'created_at' | 'success_count' | 'failure_count' | 'started_at' | 'completed_at' | 'error_details'>): Promise<BulkOperation> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('bulk_operations')
      .insert({
        ...operation,
        created_at: Date.now(),
        success_count: 0,
        failure_count: 0,
        started_at: null,
        completed_at: null,
        error_details: null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOperation(id: string, updates: Partial<BulkOperation>): Promise<BulkOperation> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('bulk_operations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startOperation(id: string): Promise<BulkOperation> {
    return this.updateOperation(id, { 
      status: 'in_progress',
      started_at: Date.now()
    });
  }

  async completeOperation(id: string, successCount: number, failureCount: number, errorDetails: any = null): Promise<BulkOperation> {
    return this.updateOperation(id, {
      status: failureCount > 0 ? 'completed' : 'completed',
      success_count: successCount,
      failure_count: failureCount,
      completed_at: Date.now(),
      error_details: errorDetails
    });
  }

  async failOperation(id: string, errorDetails: any): Promise<BulkOperation> {
    return this.updateOperation(id, {
      status: 'failed',
      completed_at: Date.now(),
      error_details: errorDetails
    });
  }

  async cancelOperation(id: string): Promise<BulkOperation> {
    return this.updateOperation(id, {
      status: 'cancelled',
      completed_at: Date.now()
    });
  }

  async incrementSuccess(id: string): Promise<BulkOperation> {
    const operation = await this.findById(id);
    if (!operation) throw new Error('Operation not found');
    return this.updateOperation(id, { success_count: operation.success_count + 1 });
  }

  async incrementFailure(id: string, errorMessage: string = null): Promise<BulkOperation> {
    const operation = await this.findById(id);
    if (!operation) throw new Error('Operation not found');
    return this.updateOperation(id, { 
      failure_count: operation.failure_count + 1,
      error_details: errorMessage ? { ...operation.error_details, last_error: errorMessage } : operation.error_details
    });
  }

  async deleteOperation(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('bulk_operations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Results management
  async getResults(bulkOperationId: string): Promise<BulkOperationResult[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('bulk_operation_results')
      .select('*')
      .eq('bulk_operation_id', bulkOperationId);

    if (error) throw error;
    return data || [];
  }

  async addResult(result: Omit<BulkOperationResult, 'id' | 'processed_at'>): Promise<BulkOperationResult> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('bulk_operation_results')
      .insert({
        ...result,
        processed_at: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteResults(bulkOperationId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('bulk_operation_results')
      .delete()
      .eq('bulk_operation_id', bulkOperationId);

    if (error) throw error;
  }
}

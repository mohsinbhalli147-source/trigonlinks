import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Customer {
  id: string;
  uid: string;
  name: string;
  fatherName?: string;
  username?: string;
  mobile: string;
  cnic?: string;
  email?: string;
  address?: string;
  area: string;
  status: 'active' | 'inactive' | 'suspended' | 'on-leave';
  package: string;
  fee: number;
  install_date?: number;
  billing_date?: number;
  install_fee?: number;
  install_fee_paid?: boolean;
  previous_balance?: number;
  emergencyContact?: string;
  notes?: string;
  iptv_enabled: boolean;
  iptv_box_number?: string;
  iptv_box_price?: number;
  iptv_installation_charges?: number;
  iptv_monthly_charges: number;
  live_ip_enabled: boolean;
  live_ip_address?: string;
  live_ip_monthly_fee: number;
  live_ip_installation_fee?: number;
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCustomerInput {
  uid: string;
  name: string;
  fatherName?: string;
  username?: string;
  mobile: string;
  cnic?: string;
  email?: string;
  address?: string;
  area: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  package: string;
  fee: number;
  install_date?: number;
  billing_date?: number;
  emergencyContact?: string;
  notes?: string;
  iptv_enabled?: boolean;
  iptv_box_number?: string;
  iptv_box_price?: number;
  iptv_installation_charges?: number;
  iptv_monthly_charges?: number;
  live_ip_enabled?: boolean;
  live_ip_address?: string;
  live_ip_monthly_fee?: number;
  live_ip_installation_fee?: number;
  created_at: number;
  created_by?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  fatherName?: string;
  username?: string;
  mobile?: string;
  cnic?: string;
  email?: string;
  address?: string;
  area?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
  package?: string;
  fee?: number;
  install_date?: number;
  billing_date?: number;
  emergencyContact?: string;
  notes?: string;
  iptv_enabled?: boolean;
  iptv_box_number?: string;
  iptv_box_price?: number;
  iptv_installation_charges?: number;
  iptv_monthly_charges?: number;
  live_ip_enabled?: boolean;
  live_ip_address?: string;
  live_ip_monthly_fee?: number;
  live_ip_installation_fee?: number;
  updated_at: number;
  updated_by?: string;
}

export class CustomersRepository extends BaseRepository<Customer> {
  constructor() {
    super('customers');
  }

  async findByMobile(mobile: string): Promise<Customer | null> {
    return this.findOne({ mobile });
  }

  async findByArea(area: string): Promise<Customer[]> {
    return this.findMany({ area });
  }

  async findByPackage(packageName: string): Promise<Customer[]> {
    return this.findMany({ package: packageName });
  }

  async findByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<Customer[]> {
    return this.findMany({ status });
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    return this.search(searchTerm, ['name', 'mobile', 'address', 'area']);
  }

  async paginateCustomers(
    params: PaginationParams & {
      status?: 'active' | 'inactive' | 'suspended' | 'on-leave';
      area?: string;
      search?: string;
    }
  ): Promise<PaginatedResult<Customer>> {
    const { status, area, search, page, limit } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }
    if (area) {
      query = query.eq('area', area);
    }
    if (search) {
      // Supabase doesn't support OR with ILIKE directly, so we'll use a simple filter
      // For production, consider using full-text search or RPC functions
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data as Customer[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    return this.create(data);
  }

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer | null> {
    return this.update(id, data);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByArea(area: string): Promise<number> {
    return this.count({ area });
  }

  async countByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<number> {
    return this.count({ status });
  }

  async countByPackage(packageName: string): Promise<number> {
    return this.count({ package: packageName });
  }

  async countIptvEnabled(): Promise<number> {
    return this.count({ iptv_enabled: true });
  }

  async countLiveIpEnabled(): Promise<number> {
    return this.count({ live_ip_enabled: true });
  }

  async sumMonthlyFeeByArea(area: string): Promise<number> {
    return this.sum('fee', { area });
  }

  async sumMonthlyFeeByStatus(status: 'active' | 'inactive' | 'suspended' | 'on-leave'): Promise<number> {
    return this.sum('fee', { status });
  }
}

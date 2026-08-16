import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

export interface Expense {
  id: string;
  name?: string;
  title?: string;
  category: string;
  amount: number;
  date: number;
  description?: string;
  area?: string;
  created_at: number;
  updated_at?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CreateExpenseInput {
  name?: string;
  title?: string;
  category: string;
  amount: number;
  date: number;
  description?: string;
  area?: string;
  created_at: number;
  created_by?: string;
}

export interface UpdateExpenseInput {
  name?: string;
  title?: string;
  category?: string;
  amount?: number;
  date?: number;
  description?: string;
  area?: string;
  updated_at: number;
  updated_by?: string;
}

export class ExpensesRepository extends BaseRepository<Expense> {
  constructor() {
    super('expenses');
  }

  async findByCategory(category: string): Promise<Expense[]> {
    return this.findMany({ category });
  }

  async findByArea(area: string): Promise<Expense[]> {
    return this.findMany({ area });
  }

  async findByDateRange(startDate: number, endDate: number): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Expense[];
  }

  async searchExpenses(searchTerm: string): Promise<Expense[]> {
    return this.search(searchTerm, ['name', 'title', 'description', 'category']);
  }

  async paginateExpenses(
    params: PaginationParams & {
      category?: string;
      startDate?: number;
      endDate?: number;
      search?: string;
    }
  ): Promise<PaginatedResult<Expense>> {
    const { category, startDate, endDate, search, page, limit } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category) {
      query = query.eq('category', category);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (search) {
      // Supabase doesn't support OR with ILIKE directly, so we'll use a simple filter
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data as Expense[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async createExpense(data: CreateExpenseInput): Promise<Expense> {
    return this.create(data);
  }

  async updateExpense(id: string, data: UpdateExpenseInput): Promise<Expense | null> {
    return this.update(id, data);
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async countByCategory(category: string): Promise<number> {
    return this.count({ category });
  }

  async countByArea(area: string): Promise<number> {
    return this.count({ area });
  }

  async sumAmount(): Promise<number> {
    return this.sum('amount');
  }

  async sumAmountByCategory(category: string): Promise<number> {
    return this.sum('amount', { category });
  }

  async sumAmountByArea(area: string): Promise<number> {
    return this.sum('amount', { area });
  }

  async sumAmountByDateRange(startDate: number, endDate: number): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('amount')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    
    const sum = data.reduce((acc: number, row: any) => acc + (parseFloat(row.amount) || 0), 0);
    return sum;
  }
}

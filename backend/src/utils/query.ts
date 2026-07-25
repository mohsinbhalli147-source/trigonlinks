export interface PaginationParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface BuiltPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const buildPagination = (params: PaginationParams) => {
  const parsedPage = parseInt(params.page || '1', 10);
  const parsedLimit = parseInt(params.limit || '10', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

export const applySearch = <T extends Record<string, any>>(
  data: T[],
  search: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!search) return data;
  
  const searchLower = search.toLowerCase();
  return data.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(searchLower);
    })
  );
};

export const applySorting = <T extends Record<string, any>>(
  data: T[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): T[] => {
  return [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const order = sortOrder === 'asc' ? 1 : -1;
    
    if (aVal === undefined || aVal === null) return 1 * order;
    if (bVal === undefined || bVal === null) return -1 * order;
    
    if (aVal < bVal) return -1 * order;
    if (aVal > bVal) return 1 * order;
    return 0;
  });
};

export const applyPagination = <T>(
  data: T[],
  skip: number,
  limit: number
): { paginatedData: T[]; total: number; totalPages: number } => {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = data.slice(skip, skip + limit);
  
  return { paginatedData, total, totalPages };
};

export const buildQueryResponse = <T>(
  data: T[],
  pagination: BuiltPagination
): PaginationResult<T> => {
  const { paginatedData, total, totalPages } = applyPagination(
    data,
    pagination.skip,
    pagination.limit
  );
  
  return {
    data: paginatedData,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
    },
  };
};

const buildPaginationMetadata = (
  pagination: BuiltPagination,
  total: number
): PaginationResult<never>['pagination'] => ({
  page: pagination.page,
  limit: pagination.limit,
  total,
  totalPages: Math.ceil(total / pagination.limit) || 1,
});

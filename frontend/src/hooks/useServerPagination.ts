import { useState, useEffect, useCallback } from 'react';

interface PaginationState<T> {
  data: T[];
  loading: boolean;
  error: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  refresh: () => void;
}

/**
 * Server-side pagination hook.
 * fetchFn receives { page, limit } and must return:
 *   { success: boolean, data?: { data: T[], pagination?: { total, totalPages } }, error?: string }
 */
export function useServerPagination<T>(
  fetchFn: (params: { page: number; limit: number }) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>,
  options: { limit?: number } = {}
): PaginationState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(options.limit || 50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchFn({ page, limit });
      if (result.success) {
        const raw = result.data;
        setData(raw?.data || []);
        if (raw?.pagination) {
          setTotal(raw.pagination.total || 0);
          setTotalPages(raw.pagination.totalPages || 0);
        }
      } else {
        setError(result.error || 'Failed to load data');
        setData([]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, refreshKey, fetchFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    refresh,
  };
}

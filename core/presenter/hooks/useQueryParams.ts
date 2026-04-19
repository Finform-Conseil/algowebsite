import { useState, useCallback } from 'react';
import { QueryParams } from '@/core/domain/types/pagination.type';

export function useQueryParams<T extends QueryParams>(initialParams: T) {
  const [params, setParams] = useState<T>(initialParams);

  const updateParams = useCallback((updates: Partial<T>, resetPage = false) => {
    setParams(prev => ({
      ...prev,
      ...updates,
      ...(resetPage ? { page: 1 } : {}),
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setParams(prev => ({ 
      ...prev, 
      search: search || undefined, 
      page: 1 
    }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ 
      ...prev, 
      page_size: pageSize, 
      page: 1 
    }));
  }, []);

  const setDateRange = useCallback((startDate?: string, endDate?: string) => {
    setParams(prev => ({
      ...prev,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page: 1,
    }));
  }, []);

  const resetParams = useCallback(() => {
    setParams(initialParams);
  }, [initialParams]);

  const removeParam = useCallback((key: keyof T) => {
    setParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  }, []);

  return {
    params,
    setParams,
    updateParams,
    setPage,
    setSearch,
    setPageSize,
    setDateRange,
    resetParams,
    removeParam,
  };
}

import { useState, useEffect, useCallback } from 'react';

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncDataActions {
  refresh: () => void;
  reset: () => void;
}

export function useAsyncData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: unknown[] = []
): AsyncDataState<T> & AsyncDataActions {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refresh,
    reset
  };
}
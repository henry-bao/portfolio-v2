import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncDataActions {
  refresh: () => void;
  reset: () => void;
}

export interface AsyncDataOptions<T> {
  enabled?: boolean;
  immediate?: boolean;
  initialData?: T | null;
  keepPreviousData?: boolean;
  getErrorMessage?: (error: unknown) => string;
}

const getDefaultErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'An error occurred');

export function useAsyncData<T>(
  fetchFunction: () => Promise<T>,
  {
    enabled = true,
    getErrorMessage = getDefaultErrorMessage,
    immediate = true,
    initialData = null,
    keepPreviousData = false,
  }: AsyncDataOptions<T> = {}
): AsyncDataState<T> & AsyncDataActions {
  const requestIdRef = useRef(0);
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate && enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();

      if (requestIdRef.current !== requestId) {
        return;
      }

      setData(result);
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setError(getErrorMessage(error));

      if (!keepPreviousData) {
        setData(null);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [enabled, fetchFunction, getErrorMessage, keepPreviousData]);

  const refresh = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!immediate || !enabled) {
      setLoading(false);
      return;
    }

    void fetchData();
  }, [enabled, fetchData, immediate]);

  return {
    data,
    loading,
    error,
    refresh,
    reset
  };
}

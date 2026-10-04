import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (err: Error) => void;
  immediate?: boolean;
}

export function useApi<T, P extends any[]>(
  apiFunc: (...args: P) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(options.immediate ? true : false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: P) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunc(...args);
        setData(result);
        if (options.onSuccess) options.onSuccess(result);
        return result;
      } catch (err: any) {
        setError(err);
        if (options.onError) options.onError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, options]
  );

  useEffect(() => {
    if (options.immediate) {
      // For immediate execution without args, we assume P is empty tuple
      (execute as any)();
    }
  }, [execute, options.immediate]);

  return { data, loading, error, execute };
}

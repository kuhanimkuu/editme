import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader when its deps change and keeps the latest result.
 * Answers from an older run are dropped, so fast switching never shows
 * stale data. `reload()` runs it again (after a change); `setData` lets a
 * page update what's shown without a round trip.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const run = useRef(0);

  const load = useCallback(loader, deps);

  const reload = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    try {
      const result = await load();
      if (id === run.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === run.current) setError(e);
    } finally {
      if (id === run.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

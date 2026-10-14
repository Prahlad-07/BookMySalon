import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../config/api';

/*
 * Tiny stale-while-revalidate GET hook.
 * - Responses are cached per URL+params for `ttl` ms, so going back to a page is instant.
 * - Changing params aborts the in-flight request, so fast typing never renders stale results.
 * - Concurrent callers of the same key share one request.
 */
const cache = new Map();
const inflight = new Map();

const keyOf = (path, params) => `${path}?${new URLSearchParams(params || {}).toString()}`;

export const prefetch = (path, params) => {
  const key = keyOf(path, params);
  if (cache.has(key) || inflight.has(key)) return;
  const p = api
    .get(path, { params })
    .then((data) => cache.set(key, { data, at: Date.now() }))
    .catch(() => {})
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
};

export default function useApi(path, params, { ttl = 60_000, enabled = true } = {}) {
  const key = path ? keyOf(path, params) : null;
  const cached = key ? cache.get(key) : null;
  const [state, setState] = useState(() => ({
    data: cached?.data ?? null,
    loading: enabled && !!key && !cached,
    error: null,
  }));
  const controller = useRef(null);

  const run = useCallback(
    async (force = false) => {
      if (!key || !enabled) return;
      const hit = cache.get(key);
      const fresh = hit && Date.now() - hit.at < ttl;
      setState((s) => ({ data: hit?.data ?? (s.key === key ? s.data : null), loading: !hit, error: null, key }));
      if (fresh && !force) return;

      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      try {
        const data = await api.get(path, { params, signal: ctrl.signal });
        cache.set(key, { data, at: Date.now() });
        if (!ctrl.signal.aborted) setState({ data, loading: false, error: null, key });
      } catch (error) {
        if (ctrl.signal.aborted) return;
        setState((s) => ({ ...s, loading: false, error, key }));
      }
    },
    // params are part of key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, enabled, ttl]
  );

  useEffect(() => {
    run();
    return () => controller.current?.abort();
  }, [run]);

  return { ...state, reload: () => run(true) };
}

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function parseEnum<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function parseInt10(raw: string | null, min: number, max: number): number | null {
  if (raw === null || !/^-?\d+$/.test(raw)) return null;
  const v = Number(raw);
  return v >= min && v <= max ? v : null;
}

/**
 * Query-string state. Updates replace the history entry, so scrubbing
 * settings doesn't flood the back button; the URL is always shareable.
 */
export function useQueryState() {
  const [params, setParams] = useSearchParams();
  const update = useCallback(
    (patch: Record<string, string | number | null>) => {
      setParams(
        prev => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === '') next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return [params, update] as const;
}

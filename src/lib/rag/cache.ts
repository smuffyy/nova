/**
 * Simple in-memory cache for embeddings / retrieved context across turns.
 */
type CacheEntry<T> = { value: T; expires: number };

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = 5 * 60 * 1000) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheKey(parts: (string | number | undefined)[]) {
  return parts.filter(Boolean).join("::");
}

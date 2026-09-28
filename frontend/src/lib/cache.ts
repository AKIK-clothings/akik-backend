/**
 * Lightweight, zero-dependency in-memory cache & request deduplicator.
 * Implements Stale-While-Revalidate (SWR) pattern for client-side API requests.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
  expiresAt: number;
}

interface FetchOptions {
  staleTimeMs?: number; // Duration data is considered fresh (ms)
  cacheTimeMs?: number; // Duration data is kept in memory (ms)
  forceRefresh?: boolean; // Force fresh network call
}

const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute default stale time
const DEFAULT_CACHE_TIME = 10 * 60 * 1000; // 10 minutes default garbage collection

class MemoryCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private listeners = new Map<string, Set<(data: unknown) => void>>();

  /**
   * Fetch with SWR caching and request deduplication.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      staleTimeMs = DEFAULT_STALE_TIME,
      cacheTimeMs = DEFAULT_CACHE_TIME,
      forceRefresh = false,
    } = options;

    const now = Date.now();
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // 1. Fresh cache hit -> return immediately, zero network calls
    if (!forceRefresh && entry && now < entry.staleAt) {
      return entry.data;
    }

    // 2. Stale cache hit -> return stale data immediately, revalidate in background
    if (!forceRefresh && entry && now < entry.expiresAt) {
      // Trigger background revalidation if not already in flight
      this.revalidateInBackground(key, fetcher, staleTimeMs, cacheTimeMs);
      return entry.data;
    }

    // 3. Cache miss or expired -> deduplicate in-flight network request
    return this.executeDeduplicated(key, fetcher, staleTimeMs, cacheTimeMs);
  }

  /**
   * Request deduplication: ensures multiple simultaneous components share a single in-flight Promise.
   */
  private executeDeduplicated<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleTimeMs: number,
    cacheTimeMs: number
  ): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetcher()
      .then((data) => {
        const now = Date.now();
        this.cache.set(key, {
          data,
          timestamp: now,
          staleAt: now + staleTimeMs,
          expiresAt: now + cacheTimeMs,
        });
        this.notifyListeners(key, data);
        return data;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Silent background revalidation (Stale-While-Revalidate).
   */
  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleTimeMs: number,
    cacheTimeMs: number
  ): void {
    if (this.inFlight.has(key)) return;

    this.executeDeduplicated(key, fetcher, staleTimeMs, cacheTimeMs).catch((err) => {
      // Background revalidation failures are logged silently without throwing to caller
      console.warn(`[Cache SWR] Background revalidation failed for ${key}:`, err);
    });
  }

  /**
   * Invalidate all cache entries matching prefix or regex.
   */
  invalidate(pattern: string | RegExp): void {
    const isRegex = pattern instanceof RegExp;
    for (const key of Array.from(this.cache.keys())) {
      const match = isRegex ? pattern.test(key) : key.startsWith(pattern);
      if (match) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Wipe all cache entries (e.g. on logout).
   */
  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  /**
   * Subscribe to cache updates for a specific key.
   */
  subscribe(key: string, listener: (data: unknown) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notifyListeners(key: string, data: unknown): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error("[Cache] Listener error:", e);
        }
      });
    }
  }
}

export const memoryCache = new MemoryCacheManager();

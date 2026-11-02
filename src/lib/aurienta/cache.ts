// AURIENTA — In-memory LRU cache for hot endpoints.
// Reduces DB round-trips for read-heavy, rarely-changing data
// (health pings, public registry, FX consensus, stats, etc.).
//
// Design:
//   - Fixed max-size LRU with TTL (default 30s for ops data, 60s for public data)
//   - Synchronous get/set, no async overhead
//   - Self-pruning on access (no background timers)
//   - Per-key TTL override supported
//   - Process-local (in-memory) — sufficient for single-instance dev server

interface CacheEntry<T> {
  value: T
  expiresAt: number // epoch ms
  // LRU doubly-linked list pointers (1 = most-recent, N = least-recent)
  prev: string | null
  next: string | null
}

const DEFAULT_TTL_MS = 30_000 // 30 seconds
const DEFAULT_MAX_ENTRIES = 256

export class LruCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>()
  private head: string | null = null // most-recently-used
  private tail: string | null = null // least-recently-used
  private readonly maxEntries: number
  private readonly defaultTtlMs: number
  // Stats
  private hits = 0
  private misses = 0
  private evictions = 0

  constructor(opts: { maxEntries?: number; defaultTtlMs?: number } = {}) {
    this.maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES
    this.defaultTtlMs = opts.defaultTtlMs ?? DEFAULT_TTL_MS
  }

  /** Get a value if present and not expired. Returns undefined otherwise. */
  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) {
      this.misses++
      return undefined
    }
    if (Date.now() > entry.expiresAt) {
      // Expired — remove
      this.unlink(entry, key)
      this.store.delete(key)
      this.misses++
      return undefined
    }
    // Move to head (most-recently-used)
    this.moveToHead(entry, key)
    this.hits++
    return entry.value
  }

  /** Set a value with optional TTL override. */
  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs)
    const existing = this.store.get(key)
    if (existing) {
      existing.value = value
      existing.expiresAt = expiresAt
      this.moveToHead(existing, key)
      return
    }
    // New entry — possibly evict LRU if at capacity
    if (this.store.size >= this.maxEntries && this.tail) {
      const evictedKey = this.tail
      const evicted = this.store.get(evictedKey)
      if (evicted) {
        this.unlink(evicted, evictedKey)
        this.store.delete(evictedKey)
        this.evictions++
      }
    }
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      prev: null,
      next: null,
    }
    this.store.set(key, entry)
    this.prepend(entry, key)
  }

  /** Invalidate a specific key. */
  delete(key: string): void {
    const entry = this.store.get(key)
    if (entry) {
      this.unlink(entry, key)
      this.store.delete(key)
    }
  }

  /** Invalidate all keys matching a prefix. */
  invalidatePrefix(prefix: string): number {
    let n = 0
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.delete(key)
        n++
      }
    }
    return n
  }

  /** Clear all entries. */
  clear(): void {
    this.store.clear()
    this.head = null
    this.tail = null
  }

  /** Get current size (including expired entries until next access). */
  get size(): number {
    return this.store.size
  }

  /** Get cache stats. */
  getStats(): { size: number; hits: number; misses: number; evictions: number; hitRate: number } {
    const total = this.hits + this.misses
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total === 0 ? 0 : this.hits / total,
    }
  }

  // ── LRU linked-list operations ──
  private prepend(entry: CacheEntry<T>, key: string): void {
    entry.prev = null
    entry.next = this.head
    if (this.head) {
      const headEntry = this.store.get(this.head)
      if (headEntry) headEntry.prev = key
    }
    this.head = key
    if (!this.tail) this.tail = key
  }

  private unlink(entry: CacheEntry<T>, key: string): void {
    if (entry.prev) {
      const prevEntry = this.store.get(entry.prev)
      if (prevEntry) prevEntry.next = entry.next
    } else {
      this.head = entry.next
    }
    if (entry.next) {
      const nextEntry = this.store.get(entry.next)
      if (nextEntry) nextEntry.prev = entry.prev
    } else {
      this.tail = entry.prev
    }
    entry.prev = null
    entry.next = null
  }

  private moveToHead(entry: CacheEntry<T>, key: string): void {
    if (this.head === key) return // already at head
    this.unlink(entry, key)
    this.prepend(entry, key)
  }
}

// ── Pre-configured caches for different use cases ──

/** Ops/health cache — 5s TTL (very fresh, but avoids DB ping on every request). */
export const opsCache = new LruCache({ maxEntries: 32, defaultTtlMs: 5_000 })

/** Public API cache — 30s TTL (stats, registry — changes rarely). */
export const publicCache = new LruCache({ maxEntries: 64, defaultTtlMs: 30_000 })

/** Reference data cache — 5min TTL (legal templates, CRE policies — near-static). */
export const referenceCache = new LruCache({ maxEntries: 128, defaultTtlMs: 300_000 })

/** FX consensus cache — 60s TTL (FX rates change intraday, not every second). */
export const fxCache = new LruCache({ maxEntries: 16, defaultTtlMs: 60_000 })

// ── Cache-aside helper ──

/**
 * Cache-aside: try cache first, on miss call the loader, cache the result.
 * Returns the cached or freshly-loaded value.
 */
export async function cacheAside<T>(
  cache: LruCache<T>,
  key: string,
  loader: () => Promise<T>,
  ttlMs?: number,
): Promise<T> {
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const fresh = await loader()
  cache.set(key, fresh, ttlMs)
  return fresh
}

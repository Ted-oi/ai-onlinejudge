import { getCache, setCache, deleteCache } from './redis'
import { logger } from '../utils/logger'

/**
 * Cache-aside pattern: try cache first, on miss fetch from DB and populate cache.
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  try {
    const cached = await getCache(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch {
    // Cache read failed, proceed to fetch
  }

  const data = await fetchFn()

  try {
    await setCache(key, JSON.stringify(data), ttl)
  } catch {
    // Cache write failed, non-critical
  }

  return data
}

export async function invalidate(key: string): Promise<void> {
  try {
    await deleteCache(key)
  } catch {
    // Non-critical
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    // For memory cache, we can't pattern match. For real Redis, we'd use keys+del.
    // Import dynamically to avoid circular deps
    const { delPattern } = await import('./redis.real')
    await delPattern(pattern)
  } catch {
    // If Redis real isn't available, try deleting known keys
    logger.debug('invalidatePattern fallback: Redis real not available')
  }
}

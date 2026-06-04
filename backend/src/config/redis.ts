import { logger } from '../utils/logger'
import * as memoryCache from './redis.memory'

let useReal = false

export async function connectRedis(): Promise<void> {
  try {
    const real = await import('./redis.real')
    await real.connect()
    useReal = true
    logger.info('Using real Redis cache')
  } catch (error) {
    logger.warn('Redis unavailable, falling back to memory cache')
    await memoryCache.connectRedis()
    useReal = false
  }
}

export async function getCache(key: string): Promise<string | null> {
  if (useReal) {
    try {
      const real = await import('./redis.real')
      return real.get(key)
    } catch {
      return memoryCache.getCache(key)
    }
  }
  return memoryCache.getCache(key)
}

export async function setCache(key: string, value: string, ttl: number = 3600): Promise<void> {
  if (useReal) {
    try {
      const real = await import('./redis.real')
      return real.setEx(key, ttl, value)
    } catch {
      return memoryCache.setCache(key, value, ttl)
    }
  }
  return memoryCache.setCache(key, value, ttl)
}

export async function deleteCache(key: string): Promise<void> {
  if (useReal) {
    try {
      const real = await import('./redis.real')
      return real.del(key)
    } catch {
      return memoryCache.deleteCache(key)
    }
  }
  return memoryCache.deleteCache(key)
}

export default { connectRedis, getCache, setCache, deleteCache }

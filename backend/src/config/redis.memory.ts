import { logger } from '../utils/logger'

// 简单的内存缓存实现
class MemoryCache {
  private cache: Map<string, { value: string; expiry: number }> = new Map()

  async connect() {
    logger.info('内存缓存已连接')
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  async setEx(key: string, ttl: number, value: string): Promise<void> {
    const expiry = Date.now() + ttl * 1000
    this.cache.set(key, { value, expiry })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async set(key: string, value: string): Promise<void> {
    return this.setEx(key, 3600, value) // 默认1小时过期
  }

  async disconnect() {
    logger.info('内存缓存已断开')
  }
}

const client = new MemoryCache()

export const connectRedis = async () => {
  await client.connect()
}

export const getCache = async (key: string) => {
  return await client.get(key)
}

export const setCache = async (key: string, value: string, ttl: number = 3600) => {
  await client.setEx(key, ttl, value)
}

export const deleteCache = async (key: string) => {
  await client.del(key)
}

export default client
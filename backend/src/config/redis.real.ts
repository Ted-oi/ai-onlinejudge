import { createClient, RedisClientType } from 'redis'
import { logger } from '../utils/logger'

let client: RedisClientType | null = null

export async function connect(): Promise<void> {
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      // 初次连接失败时不要无限重连（重连由上层 fallback 处理）
      reconnectStrategy: (retries) => {
        if (retries >= 3) return false
        return Math.min(retries * 100, 500)
      },
    },
  }) as RedisClientType

  client.on('error', (err) => {
    logger.warn('Redis client error', { message: err.message })
  })

  try {
    await client.connect()
    logger.info('Redis connected successfully')
  } catch (error) {
    // 连接失败 → 必须销毁 client，否则它会继续重连并不断触发 error 事件
    try {
      await client.disconnect()
    } catch {
      // ignore
    }
    client = null
    throw error
  }
}

export async function get(key: string): Promise<string | null> {
  if (!client) return null
  return client.get(key)
}

export async function setEx(key: string, ttl: number, value: string): Promise<void> {
  if (!client) return
  await client.setEx(key, ttl, value)
}

export async function set(key: string, value: string): Promise<void> {
  await setEx(key, 3600, value)
}

export async function del(key: string): Promise<void> {
  if (!client) return
  await client.del(key)
}

export async function disconnect(): Promise<void> {
  if (client) {
    await client.quit()
    client = null
    logger.info('Redis disconnected')
  }
}

// Sorted set operations for leaderboards
export async function zAdd(key: string, score: number, member: string): Promise<void> {
  if (!client) return
  await client.zAdd(key, { score, value: member })
}

export async function zRangeWithScores(key: string, start: number, stop: number, reverse?: boolean): Promise<Array<{ value: string; score: number }>> {
  if (!client) return []
  if (reverse) {
    return client.zRangeWithScores(key, start, stop, { REV: true })
  }
  return client.zRangeWithScores(key, start, stop)
}

export async function delPattern(pattern: string): Promise<void> {
  if (!client) return
  const keys = await client.keys(pattern)
  if (keys.length > 0) {
    await client.del(keys)
  }
}

export async function getClient(): Promise<RedisClientType | null> {
  return client
}

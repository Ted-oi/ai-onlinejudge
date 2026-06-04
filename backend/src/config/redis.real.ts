import { createClient, RedisClientType } from 'redis'
import { logger } from '../utils/logger'

let client: RedisClientType | null = null

export async function connect(): Promise<void> {
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  }) as RedisClientType

  client.on('error', (err) => {
    logger.error('Redis client error', err)
  })

  await client.connect()
  logger.info('Redis connected successfully')
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

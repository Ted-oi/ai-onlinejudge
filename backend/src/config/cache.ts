import { getOrSet, invalidate, invalidatePattern } from './redis.wrapper'

// Cache key prefixes and TTLs
const PROBLEM_LIST_TTL = 300    // 5 minutes
const PROBLEM_DETAIL_TTL = 300  // 5 minutes
const USER_STATS_TTL = 600      // 10 minutes
const LEADERBOARD_TTL = 120     // 2 minutes
const CONTEST_STANDINGS_TTL = 60 // 1 minute
const NOTIFICATION_COUNT_TTL = 30 // 30 seconds

export function cacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

// Problem caching
export const problemCache = {
  async getList<T>(filterKey: string, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSet(cacheKey('problems', 'list', filterKey), fetchFn, PROBLEM_LIST_TTL)
  },

  async getDetail<T>(problemId: number, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSet(cacheKey('problems', 'detail', problemId), fetchFn, PROBLEM_DETAIL_TTL)
  },

  async invalidateProblem(problemId: number): Promise<void> {
    await invalidate(cacheKey('problems', 'detail', problemId))
    // Invalidate all list caches
    await invalidatePattern('problems:list:*')
  },
}

// User stats caching
export const userCache = {
  async getStats<T>(userId: number, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSet(cacheKey('users', 'stats', userId), fetchFn, USER_STATS_TTL)
  },

  async invalidateStats(userId: number): Promise<void> {
    await invalidate(cacheKey('users', 'stats', userId))
  },
}

// Leaderboard caching
export const leaderboardCache = {
  async get<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSet(cacheKey('leaderboard', key), fetchFn, LEADERBOARD_TTL)
  },

  async invalidate(): Promise<void> {
    await invalidatePattern('leaderboard:*')
  },
}

// Contest standings caching
export const contestCache = {
  async getStandings<T>(contestId: number, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSet(cacheKey('contests', 'standings', contestId), fetchFn, CONTEST_STANDINGS_TTL)
  },

  async invalidateStandings(contestId: number): Promise<void> {
    await invalidate(cacheKey('contests', 'standings', contestId))
  },
}

// Notification count caching
export const notificationCache = {
  async getUnreadCount<T>(userId: number, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSet(cacheKey('notifications', 'unread', userId), fetchFn, NOTIFICATION_COUNT_TTL)
  },

  async invalidateUnreadCount(userId: number): Promise<void> {
    await invalidate(cacheKey('notifications', 'unread', userId))
  },
}

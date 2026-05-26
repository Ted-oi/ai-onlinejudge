// 使用内存缓存进行开发
import client from './redis.memory'

export { connectRedis, getCache, setCache, deleteCache } from './redis.memory'
export default client
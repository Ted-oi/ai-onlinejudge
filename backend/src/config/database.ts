import { logger } from '../utils/logger'

// 使用内存数据库进行开发
import db from './database.memory'

export { query, getClient } from './database.memory'
export default db
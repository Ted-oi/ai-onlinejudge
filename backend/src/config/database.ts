import { logger } from '../utils/logger'

const usePostgres = !!process.env.DB_HOST || process.env.DB_TYPE === 'postgres'

logger.info(`Database backend: ${usePostgres ? 'PostgreSQL' : 'Memory'}`)

let _query: (text: string, params?: any[]) => Promise<any>
let _getClient: () => any
let _closePool: (() => Promise<void>) | undefined

async function init() {
  if (usePostgres) {
    const pg = await import('./database.postgres')
    _query = pg.query
    _getClient = pg.getClient
    _closePool = pg.closePool
  } else {
    const mem = await import('./database.memory')
    _query = mem.query
    _getClient = mem.getClient
  }
}

const initPromise = init()

export const query = async (text: string, params?: any[]) => {
  await initPromise
  return _query(text, params)
}

export const getClient = async () => {
  await initPromise
  return _getClient()
}

export const closePool = async () => {
  if (_closePool) {
    await _closePool()
  }
}

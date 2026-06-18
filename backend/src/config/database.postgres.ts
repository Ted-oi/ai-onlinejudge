import { Pool } from 'pg'
import { logger } from '../utils/logger'
import fs from 'fs'
import path from 'path'

// @ts-ignore - pg types are available via @types/pg


const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'onlinejudge',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', err)
  process.exit(-1)
})

let initialized = false

async function initializeDatabase() {
  if (initialized) return

  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
    logger.info('Connected to PostgreSQL')

    const tableCheck = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
    )

    if (parseInt(tableCheck.rows[0].count) === 0) {
      logger.info('Initializing database schema...')

      const schemaPath = path.join(__dirname, '..', '..', '..', 'docker', 'init-db.sql')
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8')
        await client.query(schema)
        logger.info('Database schema initialized')
      } else {
        logger.warn('init-db.sql not found, skipping schema initialization')
      }

      const seedPath = path.join(__dirname, '..', '..', '..', 'docker', 'seed-data.sql')
      if (fs.existsSync(seedPath)) {
        const seedData = fs.readFileSync(seedPath, 'utf8')
        await client.query(seedData)
        logger.info('Seed data loaded')
      }
    }

    initialized = true

    await runMigrations(client)
  } catch (error) {
    logger.error('Failed to initialize database', error)
    throw error
  } finally {
    client.release()
  }
}

async function runMigrations(client: any) {
  const migrationsDir = path.join(__dirname, '..', '..', '..', 'docker', 'migrations')
  if (!fs.existsSync(migrationsDir)) return

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await client.query(sql)
      logger.info(`Applied migration: ${file}`)
    } catch (err) {
      logger.error(`Migration failed: ${file}`, err)
      throw err
    }
  }
}

export const query = async (text: string, params?: any[]) => {
  if (!initialized) {
    await initializeDatabase()
  }

  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    logger.debug('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount })
    return {
      rows: result.rows,
      rowCount: result.rowCount,
    }
  } catch (error) {
    logger.error('Query error', { text: text.substring(0, 100), error })
    throw error
  }
}

export const getClient = () => pool.connect()

export const closePool = async () => {
  await pool.end()
}

process.on('SIGINT', async () => {
  await closePool()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closePool()
  process.exit(0)
})

initializeDatabase().catch((err) => {
  logger.error('Database initialization failed', err)
})

export default pool

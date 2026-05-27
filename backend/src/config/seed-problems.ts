import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import dotenv from 'dotenv'

// @ts-ignore


dotenv.config()

async function seedProblems() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'onlinejudge',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  })

  try {
    const seedPath = path.join(__dirname, '..', 'data', 'problems-seed.json')
    const raw = fs.readFileSync(seedPath, 'utf8')
    const problems: any[] = JSON.parse(raw)

    const existing = await pool.query('SELECT COUNT(*) FROM problems')
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`Problems table already has ${existing.rows[0].count} rows, skipping seed.`)
      return
    }

    console.log(`Importing ${problems.length} problems...`)

    for (const p of problems) {
      await pool.query(
        `INSERT INTO problems (id, title, description, difficulty, category, categories, time_limit, memory_limit, examples)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          p.id,
          p.title,
          p.description,
          p.difficulty,
          p.category,
          JSON.stringify(p.categories || []),
          p.time_limit || 1000,
          p.memory_limit || 256,
          JSON.stringify(p.examples || []),
        ]
      )
    }

    // Reset the serial sequence
    const maxId = problems[problems.length - 1].id
    await pool.query(`SELECT setval('problems_id_seq', $1, true)`, [maxId])

    console.log(`Successfully imported ${problems.length} problems.`)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seedProblems()

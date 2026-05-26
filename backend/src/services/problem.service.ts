import { query } from '../config/database'
import { Problem, CreateProblemDTO, UpdateProblemDTO } from '../models/problem.model'

export const getProblems = async (filters: any = {}) => {
  let queryText = 'SELECT * FROM problems WHERE 1=1'
  const params: any[] = []
  let paramCount = 1

  if (filters.difficulty) {
    queryText += ` AND difficulty = $${paramCount++}`
    params.push(filters.difficulty)
  }

  if (filters.category) {
    queryText += ` AND category = $${paramCount++}`
    params.push(filters.category)
  }

  if (filters.search) {
    queryText += ` AND (title ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  if (filters.page && filters.limit) {
    const offset = (filters.page - 1) * filters.limit
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(filters.limit, offset)
  } else {
    queryText += ' ORDER BY created_at DESC'
  }

  const result = await query(queryText, params)
  return result.rows
}

export const getProblemById = async (id: number) => {
  const result = await query('SELECT * FROM problems WHERE id = $1', [id])

  if (result.rows.length === 0) {
    throw new Error('题目不存在')
  }

  return result.rows[0]
}

export const createProblem = async (data: CreateProblemDTO) => {
  const result = await query(
    `INSERT INTO problems (title, description, difficulty, category, time_limit, memory_limit, examples)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.title, data.description, data.difficulty, data.category, data.time_limit, data.memory_limit, JSON.stringify(data.examples)]
  )

  return result.rows[0]
}

export const updateProblem = async (id: number, data: UpdateProblemDTO) => {
  const updates: string[] = []
  const params: any[] = []
  let paramCount = 1

  Object.entries(data).forEach(([key, value]) => {
    updates.push(`${key} = $${paramCount++}`)
    params.push(key === 'examples' ? JSON.stringify(value) : value)
  })

  if (updates.length === 0) {
    throw new Error('没有要更新的字段')
  }

  updates.push('updated_at = NOW()')
  params.push(id)

  const queryText = `UPDATE problems SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
  const result = await query(queryText, params)

  if (result.rows.length === 0) {
    throw new Error('题目不存在')
  }

  return result.rows[0]
}

export const deleteProblem = async (id: number) => {
  const result = await query('DELETE FROM problems WHERE id = $1 RETURNING *', [id])

  if (result.rows.length === 0) {
    throw new Error('题目不存在')
  }

  return result.rows[0]
}
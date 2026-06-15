import { query } from '../config/database'
import { logger } from '../utils/logger'
import { problemCache } from '../config/cache'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendSuccessWithMessage } from '../utils/apiResponse'
import { notFound } from '../utils/apiError'

export const getProblems = asyncHandler(async (req, res) => {
  const { difficulty, category, tags, search, page = 1, limit = 20, problem_type } = req.query

  // Build a cache key from the filter parameters
  const filterKey = `${difficulty || ''}:${category || ''}:${tags || ''}:${search || ''}:${page}:${limit}:${problem_type || ''}`

  // Skip cache for search queries (highly variable)
  const useCache = !search

  const fetchData = async () => {
    let queryText = 'SELECT id, title, difficulty, category, categories, time_limit, memory_limit, problem_type, problem_no, created_at FROM problems WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (problem_type) {
      queryText += ` AND problem_type = $${paramCount++}`
      params.push(problem_type)
    }

    if (difficulty) {
      queryText += ` AND difficulty = $${paramCount++}`
      params.push(difficulty)
    }

    if (category) {
      queryText += ` AND categories @> $${paramCount++}::jsonb`
      params.push(JSON.stringify([category]))
    }

    // Support multiple tags: ?tags=dp,greedy,graph
    if (tags) {
      const tagList = String(tags).split(',').filter(t => t)
      if (tagList.length > 0) {
        queryText += ` AND categories @> $${paramCount++}::jsonb`
        params.push(JSON.stringify(tagList))
      }
    }

    if (search) {
      const searchStr = String(search)
      const searchNum = Number(searchStr)
      const searchUpper = searchStr.toUpperCase()
      const isPTFormat = /^[PT]\d+$/i.test(searchStr)
      if (isPTFormat) {
        queryText += ` AND (title ILIKE $${paramCount} OR problem_no = $${paramCount + 1})`
        params.push(`%${searchStr}%`, searchUpper)
        paramCount += 2
      } else if (!isNaN(searchNum) && searchStr !== '') {
        queryText += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR id = $${paramCount + 1})`
        params.push(`%${searchStr}%`, searchNum)
        paramCount += 2
      } else {
        queryText += ` AND (title ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`
        params.push(`%${searchStr}%`, `%${searchStr}%`)
      }
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY problem_no ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    let countText = 'SELECT COUNT(*) as total FROM problems WHERE 1=1'
    const countParams: any[] = []
    let countParam = 1
    if (problem_type) {
      countText += ` AND problem_type = $${countParam++}`
      countParams.push(problem_type)
    }
    if (difficulty) {
      countText += ` AND difficulty = $${countParam++}`
      countParams.push(difficulty)
    }
    if (category) {
      countText += ` AND categories @> $${countParam++}::jsonb`
      countParams.push(JSON.stringify([category]))
    }
    if (tags) {
      const tagList = String(tags).split(',').filter(t => t)
      if (tagList.length > 0) {
        countText += ` AND categories @> $${countParam++}::jsonb`
        countParams.push(JSON.stringify(tagList))
      }
    }
    if (search) {
      const searchStr = String(search)
      const searchNum = Number(searchStr)
      const searchUpper = searchStr.toUpperCase()
      const isPTFormat = /^[PT]\d+$/i.test(searchStr)
      if (isPTFormat) {
        countText += ` AND (title ILIKE $${countParam} OR problem_no = $${countParam + 1})`
        countParams.push(`%${searchStr}%`, searchUpper)
        countParam += 2
      } else if (!isNaN(searchNum) && searchStr !== '') {
        countText += ` AND (title ILIKE $${countParam} OR description ILIKE $${countParam} OR id = $${countParam + 1})`
        countParams.push(`%${searchStr}%`, searchNum)
        countParam += 2
      } else {
        countText += ` AND (title ILIKE $${countParam++} OR description ILIKE $${countParam++})`
        countParams.push(`%${searchStr}%`, `%${searchStr}%`)
      }
    }
    const countResult = await query(countText, countParams)

    const problems = result.rows.map((problem: any) => {
      if (problem.examples && Array.isArray(problem.examples)) {
        problem.examples = problem.examples
          .filter((example: any) => example && typeof example.input === 'string' && typeof example.output === 'string')
          .map((example: any) => ({ input: String(example.input), output: String(example.output) }))
      } else {
        problem.examples = []
      }
      return problem
    })

    return { problems, total: parseInt(countResult.rows[0].total) }
  }

  const data = useCache
    ? await problemCache.getList(filterKey, fetchData)
    : await fetchData()

  return sendSuccess(res, data)
})

export const getProblemById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const fetchProblem = async () => {
    const result = await query('SELECT * FROM problems WHERE id = $1', [id])
    if (result.rows.length === 0) return null

    const problem = result.rows[0]
    if (problem.examples && Array.isArray(problem.examples)) {
      problem.examples = problem.examples
        .filter((example: any) => example && typeof example.input === 'string' && typeof example.output === 'string')
        .map((example: any) => ({ input: String(example.input), output: String(example.output) }))
    } else {
      problem.examples = []
    }
    return problem
  }

  const problem = await problemCache.getDetail(Number(id), fetchProblem)

  if (!problem) {
    throw notFound('题目不存在')
  }

  // Hide correct answer from students
  const userRole = req.userRole
  if (problem.objective_data && userRole === 'student') {
    const { answer, ...rest } = problem.objective_data
    problem.objective_data = rest
  }

  return sendSuccess(res, { problem })
})

export const createProblem = asyncHandler(async (req, res) => {
  const { title, description, difficulty, time_limit, memory_limit, examples,
          problem_type, objective_data, categories } = req.body
  const category = req.body.category || (Array.isArray(categories) && categories.length > 0 ? categories[0] : '其他')
  const pType = problem_type || 'coding'
  const prefix = pType === 'objective' ? 'T' : 'P'

  const maxNoResult = await query(`SELECT COALESCE(MAX(CAST(SUBSTRING(problem_no, 2) AS INTEGER)), 0) as max_no FROM problems WHERE problem_no ~ $1`, [`${prefix}\\d+`])
  const nextNo = maxNoResult.rows[0].max_no + 1
  const problemNo = `${prefix}${String(nextNo).padStart(5, '0')}`

  const result = await query(
    `INSERT INTO problems (title, description, difficulty, category, categories, time_limit, memory_limit, examples, problem_type, objective_data, problem_no)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [title, description, difficulty, category, JSON.stringify(categories || []),
     time_limit || 0, memory_limit || 0, JSON.stringify(examples || []),
     pType, objective_data ? JSON.stringify(objective_data) : null, problemNo]
  )

  return sendSuccess(res, { problem: result.rows[0] }, 201)
})

export const updateProblem = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description, difficulty, time_limit, memory_limit, examples,
          problem_type, objective_data, categories } = req.body
  const category = req.body.category || (Array.isArray(categories) && categories.length > 0 ? categories[0] : '其他')

  const result = await query(
    `UPDATE problems
     SET title = $1, description = $2, difficulty = $3, category = $4, categories = $5,
         time_limit = $6, memory_limit = $7, examples = $8,
         problem_type = $9, objective_data = $10, updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [title, description, difficulty, category, JSON.stringify(categories || []),
     time_limit || 0, memory_limit || 0, JSON.stringify(examples || []),
     problem_type || 'coding', objective_data ? JSON.stringify(objective_data) : null, id]
  )

  if (result.rows.length === 0) {
    throw notFound('题目不存在')
  }

  await problemCache.invalidateProblem(Number(id))

  return sendSuccess(res, { problem: result.rows[0] })
})

export const deleteProblem = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query('DELETE FROM problems WHERE id = $1 RETURNING *', [id])

  if (result.rows.length === 0) {
    throw notFound('题目不存在')
  }

  await problemCache.invalidateProblem(Number(id))

  return sendSuccessWithMessage(res, '删除成功')
})

export const toggleFavorite = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const existing = await query(
    'SELECT id FROM problem_favorites WHERE user_id = $1 AND problem_id = $2',
    [userId, id]
  )

  if (existing.rows.length > 0) {
    await query('DELETE FROM problem_favorites WHERE user_id = $1 AND problem_id = $2', [userId, id])
    return sendSuccess(res, { favorited: false })
  }

  await query(
    'INSERT INTO problem_favorites (user_id, problem_id) VALUES ($1, $2)',
    [userId, id]
  )
  return sendSuccess(res, { favorited: true })
})

export const checkFavorite = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const result = await query(
    'SELECT id FROM problem_favorites WHERE user_id = $1 AND problem_id = $2',
    [userId, id]
  )

  return sendSuccess(res, { favorited: result.rows.length > 0 })
})

/** Returns distinct tags with usage counts. Cached for 10 minutes. */
export const getTags = asyncHandler(async (_req, res) => {
  const fetchTags = async () => {
    const result = await query(
      `SELECT tag, COUNT(*) as count FROM (
         SELECT jsonb_array_elements_text(categories) as tag
         FROM problems
         WHERE categories IS NOT NULL AND jsonb_array_length(categories) > 0
       ) sub
       WHERE tag IS NOT NULL AND tag <> ''
       GROUP BY tag
       ORDER BY count DESC`
    )
    return result.rows.map((r: any) => ({ tag: r.tag, count: parseInt(r.count) }))
  }

  const tags = await problemCache.getList('tags-with-counts', fetchTags)
  return sendSuccess(res, { tags })
})

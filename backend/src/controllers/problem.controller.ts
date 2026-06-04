import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'
import { problemCache } from '../config/cache'

export const getProblems = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
        const searchNum = Number(search)
        if (!isNaN(searchNum) && search !== '') {
          queryText += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR problem_no = $${paramCount + 1} OR id = $${paramCount + 1})`
          params.push(`%${search}%`, searchNum)
          paramCount += 2
        } else {
          queryText += ` AND (title ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`
          params.push(`%${search}%`, `%${search}%`)
        }
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
      queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
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
        const searchNum = Number(search)
        if (!isNaN(searchNum) && search !== '') {
          countText += ` AND (title ILIKE $${countParam} OR description ILIKE $${countParam} OR problem_no = $${countParam + 1} OR id = $${countParam + 1})`
          countParams.push(`%${search}%`, searchNum)
          countParam += 2
        } else {
          countText += ` AND (title ILIKE $${countParam++} OR description ILIKE $${countParam++})`
          countParams.push(`%${search}%`, `%${search}%`)
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

    res.json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const getProblemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      return res.status(404).json({
        success: false,
        error: { message: '题目不存在' }
      })
    }

    // Hide correct answer from students
    const userRole = req.userRole
    if (problem.objective_data && userRole === 'student') {
      const { answer, ...rest } = problem.objective_data
      problem.objective_data = rest
    }

    res.json({
      success: true,
      data: { problem }
    })
  } catch (error) {
    next(error)
  }
}

export const createProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, difficulty, time_limit, memory_limit, examples,
            problem_type, objective_data, categories } = req.body
    const category = req.body.category || (Array.isArray(categories) && categories.length > 0 ? categories[0] : '其他')

    const result = await query(
      `INSERT INTO problems (title, description, difficulty, category, categories, time_limit, memory_limit, examples, problem_type, objective_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, difficulty, category, JSON.stringify(categories || []),
       time_limit || 0, memory_limit || 0, JSON.stringify(examples || []),
       problem_type || 'coding', objective_data ? JSON.stringify(objective_data) : null]
    )

    res.status(201).json({
      success: true,
      data: { problem: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const updateProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      return res.status(404).json({
        success: false,
        error: { message: '题目不存在' }
      })
    }

    await problemCache.invalidateProblem(Number(id))

    res.json({
      success: true,
      data: { problem: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const deleteProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('DELETE FROM problems WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '题目不存在' }
      })
    }

    await problemCache.invalidateProblem(Number(id))

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    next(error)
  }
}

export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const existing = await query(
      'SELECT id FROM problem_favorites WHERE user_id = $1 AND problem_id = $2',
      [userId, id]
    )

    if (existing.rows.length > 0) {
      await query('DELETE FROM problem_favorites WHERE user_id = $1 AND problem_id = $2', [userId, id])
      res.json({ success: true, data: { favorited: false } })
    } else {
      await query(
        'INSERT INTO problem_favorites (user_id, problem_id) VALUES ($1, $2)',
        [userId, id]
      )
      res.json({ success: true, data: { favorited: true } })
    }
  } catch (error) {
    next(error)
  }
}

export const checkFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await query(
      'SELECT id FROM problem_favorites WHERE user_id = $1 AND problem_id = $2',
      [userId, id]
    )

    res.json({ success: true, data: { favorited: result.rows.length > 0 } })
  } catch (error) {
    next(error)
  }
}

export const getTags = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      "SELECT DISTINCT jsonb_array_elements_text(categories) as tag FROM problems WHERE categories IS NOT NULL ORDER BY tag"
    )
    const tags = result.rows.map((r: any) => r.tag).filter(Boolean)
    res.json({ success: true, data: { tags } })
  } catch (error) {
    next(error)
  }
}
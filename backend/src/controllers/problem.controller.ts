import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

export const getProblems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { difficulty, category, search, page = 1, limit = 20 } = req.query

    let queryText = 'SELECT * FROM problems WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (difficulty) {
      queryText += ` AND difficulty = $${paramCount++}`
      params.push(difficulty)
    }

    if (category) {
      // 支持按categories数组筛选
      queryText += ` AND $${paramCount} = ANY(categories)`
      params.push(category)
    }

    if (search) {
      queryText += ` AND (title ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`
      params.push(`%${search}%`, `%${search}%`)
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    // 深度修复examples字段的格式问题
    const problems = result.rows.map((problem: any) => {
      if (problem.examples && Array.isArray(problem.examples)) {
        // 确保每个example对象都有完整的input和output字段
        problem.examples = problem.examples
          .filter((example: any) => example && typeof example.input === 'string' && typeof example.output === 'string')
          .map((example: any) => ({ input: String(example.input), output: String(example.output) }))
        logger.info(`Problem ${problem.id} examples count: ${problem.examples.length}`)
      } else {
        problem.examples = []
      }
      return problem
    })

    res.json({
      success: true,
      data: { problems }
    })
  } catch (error) {
    next(error)
  }
}

export const getProblemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('SELECT * FROM problems WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '题目不存在' }
      })
    }

    // 深度修复examples字段的格式问题
    const problem = result.rows[0]
    if (problem.examples && Array.isArray(problem.examples)) {
      // 确保每个example对象都有完整的input和output字段
      problem.examples = problem.examples
        .filter((example: any) => example && typeof example.input === 'string' && typeof example.output === 'string')
        .map((example: any) => ({ input: String(example.input), output: String(example.output) }))
    } else {
      problem.examples = []
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
    const { title, description, difficulty, category, time_limit, memory_limit, examples } = req.body

    const result = await query(
      `INSERT INTO problems (title, description, difficulty, category, time_limit, memory_limit, examples)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, difficulty, category, time_limit, memory_limit, JSON.stringify(examples)]
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
    const { title, description, difficulty, category, time_limit, memory_limit, examples } = req.body

    const result = await query(
      `UPDATE problems
       SET title = $1, description = $2, difficulty = $3, category = $4,
           time_limit = $5, memory_limit = $6, examples = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, difficulty, category, time_limit, memory_limit, JSON.stringify(examples), id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '题目不存在' }
      })
    }

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

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    next(error)
  }
}
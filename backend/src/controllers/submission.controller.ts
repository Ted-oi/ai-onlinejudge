import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

export const createSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problem_id, user_id, language, code } = req.body

    // 模拟简单的代码评测
    let status = 'wrong_answer'
    let runtime = null
    let memory = null

    // 检查代码中是否包含关键模式
    if (language === 'cpp') {
      if (code.includes('cin') && code.includes('cout') && code.includes('+')) {
        status = 'accepted'
        runtime = Math.floor(Math.random() * 100) + 10
        memory = Math.floor(Math.random() * 20) + 5
      } else if (code.includes('#include')) {
        status = 'compilation_error'
      }
    } else if (language === 'python') {
      if (code.includes('input()') && code.includes('print') && code.includes('+')) {
        status = 'accepted'
        runtime = Math.floor(Math.random() * 100) + 10
        memory = Math.floor(Math.random() * 20) + 5
      } else if (!code.includes('def')) {
        status = 'runtime_error'
      }
    } else if (language === 'java') {
      if (code.includes('Scanner') && code.includes('System.out.println') && code.includes('+')) {
        status = 'accepted'
        runtime = Math.floor(Math.random() * 100) + 10
        memory = Math.floor(Math.random() * 20) + 5
      } else if (!code.includes('public class')) {
        status = 'compilation_error'
      }
    }

    const result = await query(
      `INSERT INTO submissions (problem_id, user_id, language, code, status, runtime, memory)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [problem_id, user_id, language, code, status, runtime, memory]
    )

    const submission = result.rows[0]

    // 更新用户统计（简化版本，避免复杂的UPDATE）
    const userResult = await query('SELECT * FROM users WHERE id = $1', [user_id])
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0]
      const newSubmitCount = (user.submit_count || 0) + 1
      const newSolvedCount = status === 'accepted' ? (user.solved_count || 0) + 1 : (user.solved_count || 0)
      const newRating = status === 'accepted' ? (user.rating || 1200) + 10 : (user.rating || 1200)

      const updateUserResult = await query(
        `UPDATE users
         SET submit_count = $1, solved_count = $2, rating = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [newSubmitCount, newSolvedCount, newRating, user_id]
      )
    }

    res.status(201).json({
      success: true,
      data: { submission }
    })
  } catch (error) {
    next(error)
  }
}

export const getSubmissionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('SELECT * FROM submissions WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '提交记录不存在' }
      })
    }

    res.json({
      success: true,
      data: { submission: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const getSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problem_id, user_id, status, page = 1, limit = 20 } = req.query

    let queryText = 'SELECT * FROM submissions WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (problem_id) {
      queryText += ` AND problem_id = $${paramCount++}`
      params.push(problem_id)
    }

    if (user_id) {
      queryText += ` AND user_id = $${paramCount++}`
      params.push(user_id)
    }

    if (status) {
      queryText += ` AND status = $${paramCount++}`
      params.push(status)
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    res.json({
      success: true,
      data: { submissions: result.rows }
    })
  } catch (error) {
    next(error)
  }
}

export const getUserSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { problem_id, status, page = 1, limit = 20 } = req.query

    let queryText = 'SELECT * FROM submissions WHERE user_id = $1'
    const params: any[] = [userId]
    let paramCount = 2

    if (problem_id) {
      queryText += ` AND problem_id = $${paramCount++}`
      params.push(problem_id)
    }

    if (status) {
      queryText += ` AND status = $${paramCount++}`
      params.push(status)
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    res.json({
      success: true,
      data: { submissions: result.rows }
    })
  } catch (error) {
    next(error)
  }
}
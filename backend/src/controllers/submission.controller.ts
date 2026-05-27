import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { judgeService } from '../services/judge.service'
import { logger } from '../utils/logger'

export const createSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problem_id, user_id, language, code } = req.body

    // Create submission with pending status
    const result = await query(
      `INSERT INTO submissions (problem_id, user_id, language, code, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [problem_id, user_id, language, code, 'pending']
    )

    const submission = result.rows[0]

    // Trigger async judging (don't await — respond immediately)
    judgeService.processSubmission(submission.id).catch((err) => {
      logger.error('Background judging failed', { submissionId: submission.id, error: err })
    })

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

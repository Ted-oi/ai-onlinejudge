import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { judgeService } from '../services/judge.service'
import { logger } from '../utils/logger'
import { createNotification } from './notification.controller'

export const createSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const { problem_id, language, code, contest_id, assignment_id } = req.body

    // Check problem type for objective questions
    const problemResult = await query('SELECT problem_type, objective_data, title FROM problems WHERE id = $1', [problem_id])
    if (problemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '题目不存在' } })
    }
    const problem = problemResult.rows[0]

    let status = 'pending'
    if (problem.problem_type === 'objective' && problem.objective_data) {
      const od = problem.objective_data
      if (od.type === 'choice') {
        status = (parseInt(code) === od.answer) ? 'accepted' : 'wrong_answer'
      } else if (od.type === 'judge') {
        status = (code === String(od.answer)) ? 'accepted' : 'wrong_answer'
      }
    }

    const result = await query(
      `INSERT INTO submissions (problem_id, user_id, language, code, status, contest_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [problem_id, userId, language, code, status, contest_id || null]
    )

    const submission = result.rows[0]

    if (contest_id) {
      await query(
        'INSERT INTO contest_submissions (contest_id, submission_id, user_id, problem_id) VALUES ($1, $2, $3, $4)',
        [contest_id, submission.id, userId, problem_id]
      )
    }

    if (assignment_id) {
      await query(
        `INSERT INTO assignment_submissions (assignment_id, user_id, submission_id, problem_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assignment_id, user_id, problem_id) DO UPDATE SET submission_id = $3, created_at = NOW()`,
        [assignment_id, userId, submission.id, problem_id]
      )
    }

    // Objective: update stats immediately; Coding: send to judge
    if (problem.problem_type === 'objective') {
      await judgeService.updateUserStats(userId, status)
      await judgeService.updateSkillAndActivity(userId, problem_id, status)
      createNotification(
        userId, 'submission_result',
        status === 'accepted' ? '回答正确' : '回答错误',
        `题目「${problem.title}」${status === 'accepted' ? '回答正确！' : '回答错误'}`,
        `/submissions/${submission.id}`
      )
    } else {
      judgeService.processSubmission(submission.id).catch(async (err) => {
        logger.error('Background judging failed', { submissionId: submission.id, error: err })
        try {
          await query(
            'UPDATE submissions SET status = $1, error_message = $2 WHERE id = $3',
            ['system_error', `评测失败: ${err.message || '未知错误'}`, submission.id]
          )
        } catch (_) { /* ignore */ }
      })
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

    const result = await query(
      `SELECT s.*, p.title as problem_title, p.problem_no
       FROM submissions s
       LEFT JOIN problems p ON s.problem_id = p.id
       WHERE s.id = $1`,
      [id]
    )

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

    let queryText = `SELECT s.id, s.problem_id, s.user_id, s.language, s.status, s.runtime, s.memory, s.created_at, s.contest_id,
       p.title as problem_title, p.problem_no, u.username
       FROM submissions s
       LEFT JOIN problems p ON s.problem_id = p.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE 1=1`
    const params: any[] = []
    let paramCount = 1

    if (problem_id) {
      queryText += ` AND s.problem_id = $${paramCount++}`
      params.push(problem_id)
    }

    if (user_id) {
      queryText += ` AND s.user_id = $${paramCount++}`
      params.push(user_id)
    }

    if (status) {
      queryText += ` AND s.status = $${paramCount++}`
      params.push(status)
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY s.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
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

    let queryText = `SELECT s.*, p.title as problem_title, p.problem_no
       FROM submissions s
       LEFT JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = $1`
    const params: any[] = [userId]
    let paramCount = 2

    if (problem_id) {
      queryText += ` AND s.problem_id = $${paramCount++}`
      params.push(problem_id)
    }

    if (status) {
      queryText += ` AND s.status = $${paramCount++}`
      params.push(status)
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY s.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
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

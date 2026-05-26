import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

export const getContests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    let queryText = 'SELECT * FROM contests WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (status) {
      const now = new Date()
      if (status === 'upcoming') {
        queryText += ` AND start_time > $${paramCount++}`
        params.push(now)
      } else if (status === 'ongoing') {
        queryText += ` AND start_time <= $${paramCount++} AND end_time >= $${paramCount++}`
        params.push(now, now)
      } else if (status === 'past') {
        queryText += ` AND end_time < $${paramCount++}`
        params.push(now)
      }
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY start_time DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    res.json({
      success: true,
      data: { contests: result.rows }
    })
  } catch (error) {
    next(error)
  }
}

export const getContestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('SELECT * FROM contests WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '比赛不存在' }
      })
    }

    const problemsResult = await query(
      'SELECT problem_id FROM contest_problems WHERE contest_id = $1 ORDER BY order_index',
      [id]
    )

    res.json({
      success: true,
      data: {
        contest: result.rows[0],
        problem_ids: problemsResult.rows.map(row => row.problem_id)
      }
    })
  } catch (error) {
    next(error)
  }
}

export const createContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, start_time, end_time, creator_id, problem_ids } = req.body

    const result = await query(
      `INSERT INTO contests (title, description, start_time, end_time, creator_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, start_time, end_time, creator_id]
    )

    const contestId = result.rows[0].id

    if (problem_ids && problem_ids.length > 0) {
      for (let i = 0; i < problem_ids.length; i++) {
        await query(
          `INSERT INTO contest_problems (contest_id, problem_id, order_index)
           VALUES ($1, $2, $3)`,
          [contestId, problem_ids[i], i]
        )
      }
    }

    res.status(201).json({
      success: true,
      data: { contest: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const updateContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { title, description, start_time, end_time } = req.body

    const result = await query(
      `UPDATE contests
       SET title = $1, description = $2, start_time = $3, end_time = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, start_time, end_time, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '比赛不存在' }
      })
    }

    res.json({
      success: true,
      data: { contest: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const deleteContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('DELETE FROM contests WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '比赛不存在' }
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

export const registerForContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { user_id } = req.body

    const existing = await query(
      'SELECT * FROM contest_registrations WHERE contest_id = $1 AND user_id = $2',
      [id, user_id]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: '已经注册过该比赛' }
      })
    }

    await query(
      `INSERT INTO contest_registrations (contest_id, user_id)
       VALUES ($1, $2)`,
      [id, user_id]
    )

    res.json({
      success: true,
      message: '注册成功'
    })
  } catch (error) {
    next(error)
  }
}
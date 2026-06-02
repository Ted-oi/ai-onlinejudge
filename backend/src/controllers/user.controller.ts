import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (role) {
      whereClause += ` AND role = $${paramCount++}`
      params.push(role)
    }

    if (search) {
      whereClause += ` AND (username ILIKE $${paramCount++} OR email ILIKE $${paramCount++})`
      params.push(`%${search}%`, `%${search}%`)
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params)
    const total = parseInt(countResult.rows[0].total)

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    const queryText = `SELECT id, username, email, role, avatar, bio, rating, solved_count, submit_count FROM users ${whereClause} ORDER BY rating DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    res.json({
      success: true,
      data: { users: result.rows, total }
    })
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query(
      'SELECT id, username, email, role, avatar, bio, rating, solved_count, submit_count FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '用户不存在' }
      })
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const currentUserId = (req as any).userId
    const currentUserRole = (req as any).userRole

    if (Number(id) !== currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: '无权修改其他用户信息' }
      })
    }

    const { username, avatar, bio } = req.body

    const result = await query(
      `UPDATE users
       SET username = $1, avatar = $2, bio = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, email, role, avatar, bio, rating, solved_count, submit_count`,
      [username, avatar, bio, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '用户不存在' }
      })
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const submissionsResult = await query(
      `SELECT status, COUNT(*) as count
       FROM submissions
       WHERE user_id = $1
       GROUP BY status`,
      [id]
    )

    const solvedResult = await query(
      `SELECT COUNT(DISTINCT problem_id) as solved_count
       FROM submissions
       WHERE user_id = $1 AND status = 'accepted'`,
      [id]
    )

    res.json({
      success: true,
      data: {
        submissions_by_status: submissionsResult.rows,
        solved_count: solvedResult.rows[0].solved_count
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getUserFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query(
      `SELECT p.*, pf.created_at as favorited_at
       FROM problem_favorites pf
       JOIN problems p ON pf.problem_id = p.id
       WHERE pf.user_id = $1
       ORDER BY pf.created_at DESC`,
      [id]
    )

    res.json({ success: true, data: { favorites: result.rows } })
  } catch (error) {
    next(error)
  }
}

export const getUserSkillRadar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query(
      'SELECT category, solved_count, attempt_count FROM user_skills WHERE user_id = $1',
      [id]
    )

    res.json({ success: true, data: { skills: result.rows } })
  } catch (error) {
    next(error)
  }
}

export const getUserActivityHeatmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query(
      `SELECT activity_date, submission_count, solved_count
       FROM user_daily_activity
       WHERE user_id = $1 AND activity_date >= NOW() - INTERVAL '1 year'
       ORDER BY activity_date ASC`,
      [id]
    )

    res.json({ success: true, data: { activities: result.rows } })
  } catch (error) {
    next(error)
  }
}
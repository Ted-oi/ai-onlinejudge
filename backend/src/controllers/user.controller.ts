import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'
import { checkAndAwardBadges } from '../services/achievement.service'

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
      `SELECT id, username, email, role, avatar, bio, rating, solved_count, submit_count,
        school, organization, github_url, created_at FROM users WHERE id = $1`,
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
    const currentUserId = req.userId
    const currentUserRole = req.userRole

    if (Number(id) !== currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: '无权修改其他用户信息' }
      })
    }

    const { username, avatar, bio, school, organization, github_url } = req.body

    const result = await query(
      `UPDATE users
       SET username = COALESCE($1, username), avatar = COALESCE($2, avatar),
        bio = COALESCE($3, bio), school = COALESCE($4, school),
        organization = COALESCE($5, organization), github_url = COALESCE($6, github_url),
        updated_at = NOW()
       WHERE id = $7
       RETURNING id, username, email, role, avatar, bio, rating, solved_count, submit_count,
        school, organization, github_url`,
      [username || null, avatar || null, bio || null, school || null, organization || null, github_url || null, id]
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

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const userRes = await query(
      `SELECT id, username, role, avatar, bio, rating, solved_count, submit_count,
        school, organization, github_url, created_at FROM users WHERE id = $1`,
      [id]
    )

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '用户不存在' } })
    }

    const user = userRes.rows[0]

    const [statsRes, achievementsRes, categoriesRes] = await Promise.all([
      query(
        `SELECT status, COUNT(*) as count FROM submissions WHERE user_id = $1 GROUP BY status`,
        [id]
      ),
      query(
        `SELECT badge_type, badge_name, description, icon, earned_at FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC`,
        [id]
      ),
      query(
        `SELECT category, solved_count FROM user_skills WHERE user_id = $1 AND solved_count > 0`,
        [id]
      ),
    ])

    res.json({
      success: true,
      data: {
        user,
        stats: statsRes.rows,
        achievements: achievementsRes.rows,
        categories: categoriesRes.rows,
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getUserAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT badge_type, badge_name, description, icon, earned_at FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC`,
      [id]
    )
    res.json({ success: true, data: { achievements: result.rows } })
  } catch (error) {
    next(error)
  }
}

export const getRatingHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT rating, reason, contest_id, created_at FROM rating_history WHERE user_id = $1 ORDER BY created_at ASC`,
      [id]
    )
    res.json({ success: true, data: { history: result.rows } })
  } catch (error) {
    next(error)
  }
}

export const getSolvedProblems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20, difficulty, category } = req.query

    const conditions = [
      `s.user_id = $1 AND s.status = 'accepted'`
    ]
    const params: any[] = [id]
    let pc = 2

    if (difficulty) { conditions.push(`p.difficulty = $${pc++}`); params.push(difficulty) }
    if (category) { conditions.push(`p.category = $${pc++}`); params.push(category) }

    const where = conditions.join(' AND ')
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const result = await query(
      `SELECT DISTINCT ON (s.problem_id) s.problem_id, p.title, p.difficulty, p.category,
        MAX(s.created_at) as solved_at
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE ${where}
       GROUP BY s.problem_id, p.title, p.difficulty, p.category
       ORDER BY s.problem_id, solved_at DESC
       LIMIT $${pc++} OFFSET $${pc++}`,
      [...params, parseInt(limit as string), offset]
    )

    const countRes = await query(
      `SELECT COUNT(DISTINCT problem_id) as total FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE ${where}`,
      params
    )

    res.json({
      success: true,
      data: { problems: result.rows, total: parseInt(countRes.rows[0].total) }
    })
  } catch (error) {
    next(error)
  }
}

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const currentUserId = req.userId
    if (Number(id) !== currentUserId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, error: { message: '无权操作' } })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: '请选择图片' } })
    }

    const avatarUrl = `/api/avatars/${req.file.filename}`

    await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, id])

    res.json({ success: true, data: { avatar: avatarUrl } })
  } catch (error) {
    next(error)
  }
}

export const checkBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const newBadges = await checkAndAwardBadges(Number(id))
    res.json({ success: true, data: { new_badges: newBadges } })
  } catch (error) {
    next(error)
  }
}
import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, problems, submissions, courses, contests, statusBreakdown, recentSubmissions] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM problems'),
      query('SELECT COUNT(*) as count FROM submissions'),
      query('SELECT COUNT(*) as count FROM courses'),
      query('SELECT COUNT(*) as count FROM contests'),
      query('SELECT status, COUNT(*) as count FROM submissions GROUP BY status ORDER BY count DESC'),
      query(`
        SELECT s.id, s.problem_id, s.user_id, s.language, s.status, s.created_at,
               p.title as problem_title, u.username
        FROM submissions s
        LEFT JOIN problems p ON s.problem_id = p.id
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC LIMIT 10
      `),
    ])

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].count),
        totalProblems: parseInt(problems.rows[0].count),
        totalSubmissions: parseInt(submissions.rows[0].count),
        totalCourses: parseInt(courses.rows[0].count),
        totalContests: parseInt(contests.rows[0].count),
        statusBreakdown: statusBreakdown.rows.map((r: any) => ({
          status: r.status,
          count: parseInt(r.count),
        })),
        recentSubmissions: recentSubmissions.rows,
      },
    })
  } catch (error) {
    logger.error('Get dashboard stats error', error)
    next(error)
  }
}

export const getPublicStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, problems, submissions, courses, contests] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM problems'),
      query('SELECT COUNT(*) as count FROM submissions'),
      query('SELECT COUNT(*) as count FROM courses'),
      query('SELECT COUNT(*) as count FROM contests'),
    ])

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].count),
        totalProblems: parseInt(problems.rows[0].count),
        totalSubmissions: parseInt(submissions.rows[0].count),
        totalCourses: parseInt(courses.rows[0].count),
        totalContests: parseInt(contests.rows[0].count),
      },
    })
  } catch (error) {
    logger.error('Get public stats error', error)
    next(error)
  }
}

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: '无效的角色类型' },
      })
    }

    const result = await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role',
      [role, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '用户不存在' },
      })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    logger.error('Update user role error', error)
    next(error)
  }
}

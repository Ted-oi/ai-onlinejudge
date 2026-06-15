import { query } from '../config/database'
import { logger } from '../utils/logger'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { badRequest, notFound } from '../utils/apiError'

export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const [users, problems, submissions, courses, contests, statusBreakdown, recentSubmissions, pendingArticles] = await Promise.all([
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
      query("SELECT COUNT(*) as count FROM articles WHERE status = 'pending'"),
    ])

    return sendSuccess(res, {
      totalUsers: parseInt(users.rows[0].count),
      totalProblems: parseInt(problems.rows[0].count),
      totalSubmissions: parseInt(submissions.rows[0].count),
      totalCourses: parseInt(courses.rows[0].count),
      totalContests: parseInt(contests.rows[0].count),
      pendingArticles: parseInt(pendingArticles.rows[0].count),
      statusBreakdown: statusBreakdown.rows.map((r: any) => ({
        status: r.status,
        count: parseInt(r.count),
      })),
      recentSubmissions: recentSubmissions.rows,
    })
  } catch (error) {
    logger.error('Get dashboard stats error', error)
    throw error
  }
})

export const getPublicStats = asyncHandler(async (req, res) => {
  try {
    const [users, problems, submissions, courses, contests] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM problems'),
      query('SELECT COUNT(*) as count FROM submissions'),
      query('SELECT COUNT(*) as count FROM courses'),
      query('SELECT COUNT(*) as count FROM contests'),
    ])

    return sendSuccess(res, {
      totalUsers: parseInt(users.rows[0].count),
      totalProblems: parseInt(problems.rows[0].count),
      totalSubmissions: parseInt(submissions.rows[0].count),
      totalCourses: parseInt(courses.rows[0].count),
      totalContests: parseInt(contests.rows[0].count),
    })
  } catch (error) {
    logger.error('Get public stats error', error)
    throw error
  }
})

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { role } = req.body

  if (!['student', 'teacher', 'admin'].includes(role)) {
    throw badRequest('无效的角色类型')
  }

  const result = await query(
    'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role',
    [role, id]
  )

  if (result.rows.length === 0) {
    throw notFound('用户不存在')
  }

  return sendSuccess(res, result.rows[0])
})

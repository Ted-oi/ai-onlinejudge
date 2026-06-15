import { query } from '../config/database'
import { logger } from '../utils/logger'
import { checkAndAwardBadges } from '../services/achievement.service'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { notFound, badRequest, forbidden } from '../utils/apiError'

export const getUsers = asyncHandler(async (req, res) => {
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

  return sendSuccess(res, { users: result.rows, total })
})

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query(
    `SELECT id, username, email, role, avatar, bio, rating, solved_count, submit_count,
        school, organization, github_url, created_at FROM users WHERE id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw notFound('用户不存在')
  }

  return sendSuccess(res, { user: result.rows[0] })
})

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  const currentUserId = req.userId
  const currentUserRole = req.userRole

  if (Number(id) !== currentUserId && currentUserRole !== 'admin') {
    throw forbidden('无权修改其他用户信息')
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
    throw notFound('用户不存在')
  }

  return sendSuccess(res, { user: result.rows[0] })
})

export const getUserStats = asyncHandler(async (req, res) => {
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

  return sendSuccess(res, {
    submissions_by_status: submissionsResult.rows,
    solved_count: solvedResult.rows[0].solved_count
  })
})

export const getUserFavorites = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query(
    `SELECT p.*, pf.created_at as favorited_at
       FROM problem_favorites pf
       JOIN problems p ON pf.problem_id = p.id
       WHERE pf.user_id = $1
       ORDER BY pf.created_at DESC`,
    [id]
  )

  return sendSuccess(res, { favorites: result.rows })
})

export const getUserSkillRadar = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query(
    'SELECT category, solved_count, attempt_count FROM user_skills WHERE user_id = $1',
    [id]
  )

  return sendSuccess(res, { skills: result.rows })
})

export const getUserActivityHeatmap = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query(
    `SELECT activity_date, submission_count, solved_count
       FROM user_daily_activity
       WHERE user_id = $1 AND activity_date >= NOW() - INTERVAL '1 year'
       ORDER BY activity_date ASC`,
    [id]
  )

  return sendSuccess(res, { activities: result.rows })
})

export const getPublicProfile = asyncHandler(async (req, res) => {
  const { id } = req.params

  const userRes = await query(
    `SELECT id, username, role, avatar, bio, rating, solved_count, submit_count,
        school, organization, github_url, created_at FROM users WHERE id = $1`,
    [id]
  )

  if (userRes.rows.length === 0) {
    throw notFound('用户不存在')
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

  return sendSuccess(res, {
    user,
    stats: statsRes.rows,
    achievements: achievementsRes.rows,
    categories: categoriesRes.rows,
  })
})

export const getUserAchievements = asyncHandler(async (req, res) => {
  const { id } = req.params
  const result = await query(
    `SELECT badge_type, badge_name, description, icon, earned_at FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC`,
    [id]
  )
  return sendSuccess(res, { achievements: result.rows })
})

export const getRatingHistory = asyncHandler(async (req, res) => {
  const { id } = req.params
  const result = await query(
    `SELECT rating, reason, contest_id, created_at FROM rating_history WHERE user_id = $1 ORDER BY created_at ASC`,
    [id]
  )
  return sendSuccess(res, { history: result.rows })
})

export const getSolvedProblems = asyncHandler(async (req, res) => {
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

  return sendSuccess(res, { problems: result.rows, total: parseInt(countRes.rows[0].total) })
})

export const uploadAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params
  const currentUserId = req.userId
  if (Number(id) !== currentUserId && req.userRole !== 'admin') {
    throw forbidden('无权操作')
  }

  if (!req.file) {
    throw badRequest('请选择图片')
  }

  const avatarUrl = `/api/avatars/${req.file.filename}`

  await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, id])

  return sendSuccess(res, { avatar: avatarUrl })
})

export const checkBadges = asyncHandler(async (req, res) => {
  const { id } = req.params
  const newBadges = await checkAndAwardBadges(Number(id))
  return sendSuccess(res, { new_badges: newBadges })
})

import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { badRequest } from '../utils/apiError'

/**
 * Returns the current user's submission counts (total and accepted) per day for
 * the last 30 days. Used by the home page submission trend area chart.
 */
export const getSubmissionTrend = asyncHandler(async (req, res) => {
  const userId = req.userId
  const result = await query(
    `SELECT DATE(created_at) as date, COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'accepted') as accepted
     FROM submissions
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at) ORDER BY date`,
    [userId]
  )
  return sendSuccess(res, result.rows.map((r: any) => ({
    ...r,
    total: parseInt(r.total),
    accepted: parseInt(r.accepted),
  })))
})

/**
 * Returns the count of distinct problems the current user has solved, grouped by
 * difficulty. Used by the home page difficulty distribution pie chart.
 */
export const getDifficultyDistribution = asyncHandler(async (req, res) => {
  const userId = req.userId
  const result = await query(
    `SELECT p.difficulty, COUNT(DISTINCT s.problem_id) as solved
     FROM submissions s
     JOIN problems p ON s.problem_id = p.id
     WHERE s.user_id = $1 AND s.status = 'accepted'
     GROUP BY p.difficulty`,
    [userId]
  )
  return sendSuccess(res, result.rows)
})

/**
 * Admin/teacher dashboard trend: submission and new-user counts per day for the
 * last 7 days.
 */
export const getAdminTrend = asyncHandler(async (req, res) => {
  const [submissionTrend, userTrend] = await Promise.all([
    query(
      `SELECT DATE(created_at) as date, COUNT(*) as total
       FROM submissions WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at) ORDER BY date`
    ),
    query(
      `SELECT DATE(created_at) as date, COUNT(*) as total
       FROM users WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at) ORDER BY date`
    ),
  ])
  return sendSuccess(res, {
    submissions: submissionTrend.rows.map((r: any) => ({ ...r, total: parseInt(r.total) })),
    users: userTrend.rows.map((r: any) => ({ ...r, total: parseInt(r.total) })),
  })
})

/**
 * Uploads a course material file. Returns the URL, name, size, and MIME type.
 */
export const uploadMaterial = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw badRequest('没有上传文件')
  }
  const fileUrl = `/uploads/courses/${req.file.filename}`
  return sendSuccess(res, {
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  })
})

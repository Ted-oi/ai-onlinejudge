import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendSuccessWithMessage } from '../utils/apiResponse'
import { notFound, badRequest, forbidden } from '../utils/apiError'
import { createNotification } from './notification.controller'

const VALID_CATEGORIES = ['description', 'testdata', 'solution', 'spj', 'other'] as const
const VALID_SEVERITIES = ['low', 'normal', 'high', 'critical'] as const

export const createReport = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { problem_id, category, severity = 'normal', title, content } = req.body

  if (!problem_id || !title || !content) {
    throw badRequest('缺少必要字段')
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw badRequest('无效的反馈类别')
  }
  if (!VALID_SEVERITIES.includes(severity)) {
    throw badRequest('无效的严重程度')
  }

  const problemRes = await query('SELECT id, title FROM problems WHERE id = $1', [problem_id])
  if (problemRes.rows.length === 0) throw notFound('题目不存在')

  // 速率限制：同一用户对同一题目 1 小时内只能反馈一次
  const recent = await query(
    `SELECT id FROM problem_reports
      WHERE user_id = $1 AND problem_id = $2
        AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId, problem_id]
  )
  if (recent.rows.length > 0) {
    throw badRequest('已提交反馈，请等待审核')
  }

  const result = await query(
    `INSERT INTO problem_reports (problem_id, user_id, category, severity, title, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, status, created_at`,
    [problem_id, userId, category, severity, title, content]
  )

  return sendSuccessWithMessage(res, '已提交反馈，感谢您的贡献', result.rows[0], 201)
})

export const getMyReports = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { status, page = 1, limit = 20 } = req.query

  const conditions = ['r.user_id = $1']
  const params: any[] = [userId]
  let pc = 2
  if (status) {
    conditions.push(`r.status = $${pc++}`)
    params.push(status)
  }

  const countRes = await query(
    `SELECT COUNT(*)::int as total FROM problem_reports r WHERE ${conditions.join(' AND ')}`,
    params
  )
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
  const rows = (await query(
    `SELECT r.id, r.problem_id, r.category, r.severity, r.title, r.content,
            r.status, r.admin_comment, r.created_at, r.updated_at, r.reviewed_at,
            p.title as problem_title
       FROM problem_reports r
       JOIN problems p ON p.id = r.problem_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.created_at DESC
       LIMIT $${pc++} OFFSET $${pc++}`,
    [...params, parseInt(limit as string), offset]
  )).rows

  return sendSuccess(res, { reports: rows, total: countRes.rows[0].total })
})

export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId
  const userRole = req.userRole

  const result = await query(
    `SELECT r.*, p.title as problem_title, u.username as reporter_name
       FROM problem_reports r
       JOIN problems p ON p.id = r.problem_id
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1`,
    [id]
  )
  if (result.rows.length === 0) throw notFound('反馈不存在')

  const r = result.rows[0]
  if (r.user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
    throw forbidden('无权查看该反馈')
  }

  return sendSuccess(res, r)
})

export const listReports = asyncHandler(async (req, res) => {
  const { status, category, problem_id, page = 1, limit = 20 } = req.query

  const conditions: string[] = []
  const params: any[] = []
  let pc = 1
  if (status) { conditions.push(`r.status = $${pc++}`); params.push(status) }
  if (category) { conditions.push(`r.category = $${pc++}`); params.push(category) }
  if (problem_id) { conditions.push(`r.problem_id = $${pc++}`); params.push(problem_id) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRes = await query(
    `SELECT COUNT(*)::int as total FROM problem_reports r ${where}`,
    params
  )
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
  const rows = (await query(
    `SELECT r.id, r.problem_id, r.category, r.severity, r.title, r.status,
            r.created_at, r.updated_at, r.reviewed_at, r.admin_comment,
            p.title as problem_title,
            u.username as reporter_name, u.avatar as reporter_avatar
       FROM problem_reports r
       JOIN problems p ON p.id = r.problem_id
       JOIN users u ON u.id = r.user_id
       ${where}
       ORDER BY
         CASE r.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1
                         WHEN 'normal' THEN 2 ELSE 3 END,
         CASE r.status WHEN 'pending' THEN 0 WHEN 'reviewing' THEN 1
                       WHEN 'resolved' THEN 2 ELSE 3 END,
         r.created_at DESC
       LIMIT $${pc++} OFFSET $${pc++}`,
    [...params, parseInt(limit as string), offset]
  )).rows

  return sendSuccess(res, { reports: rows, total: countRes.rows[0].total })
})

export const reviewReport = asyncHandler(async (req, res) => {
  const { id } = req.params
  const reviewerId = req.userId
  const { status, admin_comment } = req.body

  if (!['reviewing', 'resolved', 'rejected'].includes(status)) {
    throw badRequest('无效的状态')
  }

  const result = await query(
    `UPDATE problem_reports
       SET status = $1, admin_comment = $2, reviewer_id = $3,
           reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING user_id, problem_id, title`,
    [status, admin_comment || null, reviewerId, id]
  )
  if (result.rows.length === 0) throw notFound('反馈不存在')

  const r = result.rows[0]
  const statusLabel: Record<string, string> = {
    reviewing: '正在处理', resolved: '已解决', rejected: '已驳回',
  }
  await createNotification(
    r.user_id,
    'report_review',
    '题目反馈处理结果',
    `您对《${r.title}》的反馈已更新为：${statusLabel[status] || status}${
      admin_comment ? `（${admin_comment}）` : ''
    }`,
    `/problems/${r.problem_id}`
  )

  return sendSuccessWithMessage(res, '已更新反馈状态', result.rows[0])
})

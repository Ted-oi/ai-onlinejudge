import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { notFound, forbidden } from '../utils/apiError'

export const getDiscussions = asyncHandler(async (req, res) => {
  const { problemId } = req.params
  const { page = 1, limit = 20 } = req.query

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

  const result = await query(
    `SELECT d.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as reply_count
       FROM discussions d
       JOIN users u ON d.user_id = u.id
       WHERE d.problem_id = $1
       ORDER BY d.is_pinned DESC, d.updated_at DESC
       LIMIT $2 OFFSET $3`,
    [problemId, parseInt(limit as string), offset]
  )

  return sendSuccess(res, { discussions: result.rows })
})

export const createDiscussion = asyncHandler(async (req, res) => {
  const { problemId } = req.params
  const userId = req.userId
  const { title, content } = req.body

  const result = await query(
    `INSERT INTO discussions (problem_id, user_id, title, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
    [problemId, userId, title, content]
  )

  return sendSuccess(res, { discussion: result.rows[0] }, 201)
})

export const getDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params

  await query('UPDATE discussions SET views = views + 1 WHERE id = $1', [id])

  const result = await query(
    `SELECT d.*, u.username, u.avatar
       FROM discussions d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw notFound('讨论不存在')
  }

  const replies = await query(
    `SELECT r.*, u.username, u.avatar
       FROM discussion_replies r
       JOIN users u ON r.user_id = u.id
       WHERE r.discussion_id = $1
       ORDER BY r.created_at ASC`,
    [id]
  )

  return sendSuccess(res, { discussion: result.rows[0], replies: replies.rows })
})

export const updateDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId
  const userRole = req.userRole
  const { title, content, is_pinned } = req.body

  if (is_pinned !== undefined && userRole !== 'admin' && userRole !== 'teacher') {
    throw forbidden('权限不足')
  }

  const existing = await query('SELECT user_id FROM discussions WHERE id = $1', [id])
  if (existing.rows.length === 0) {
    throw notFound('讨论不存在')
  }

  if (existing.rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
    throw forbidden('权限不足')
  }

  const result = await query(
    `UPDATE discussions SET title = COALESCE($1, title), content = COALESCE($2, content),
       is_pinned = COALESCE($3, is_pinned), updated_at = NOW() WHERE id = $4 RETURNING *`,
    [title || null, content || null, is_pinned !== undefined ? is_pinned : null, id]
  )

  return sendSuccess(res, { discussion: result.rows[0] })
})

export const deleteDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId
  const userRole = req.userRole

  const existing = await query('SELECT user_id FROM discussions WHERE id = $1', [id])
  if (existing.rows.length === 0) {
    throw notFound('讨论不存在')
  }

  if (existing.rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
    throw forbidden('权限不足')
  }

  await query('DELETE FROM discussions WHERE id = $1', [id])

  return sendSuccess(res, { message: '已删除' })
})

export const createReply = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId
  const { content, parent_reply_id } = req.body

  const result = await query(
    `INSERT INTO discussion_replies (discussion_id, user_id, parent_reply_id, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, userId, parent_reply_id || null, content]
  )

  await query('UPDATE discussions SET updated_at = NOW() WHERE id = $1', [id])

  const replyWithUser = await query(
    `SELECT r.*, u.username, u.avatar FROM discussion_replies r
       JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
    [result.rows[0].id]
  )

  return sendSuccess(res, { reply: replyWithUser.rows[0] }, 201)
})

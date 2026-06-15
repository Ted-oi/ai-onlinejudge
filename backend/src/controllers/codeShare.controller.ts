import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { notFound, badRequest, forbidden } from '../utils/apiError'

export const getSharedCodes = asyncHandler(async (req, res) => {
  const { problem_id, language, user_id, search, sort = 'newest', page = 1, limit = 20 } = req.query
  const conditions = ["sc.is_public = TRUE"]
  const params: any[] = []
  let pc = 1

  if (problem_id) { conditions.push(`sc.problem_id = $${pc++}`); params.push(problem_id) }
  if (language) { conditions.push(`sc.language = $${pc++}`); params.push(language) }
  if (user_id) { conditions.push(`sc.user_id = $${pc++}`); params.push(user_id) }
  if (search) {
    conditions.push(`(sc.title ILIKE $${pc} OR sc.description ILIKE $${pc} OR sc.code ILIKE $${pc})`)
    params.push(`%${search}%`); pc++
  }

  const where = 'WHERE ' + conditions.join(' AND ')
  const orderMap: Record<string, string> = {
    newest: 'sc.created_at DESC',
    most_liked: 'sc.like_count DESC, sc.created_at DESC',
    most_pinned: 'sc.pin_count DESC, sc.created_at DESC',
  }

  const countRes = await query(`SELECT COUNT(*) as total FROM shared_codes sc ${where}`, params)
  const total = parseInt(countRes.rows[0].total)
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

  const result = await query(
    `SELECT sc.*, u.username as author_name, u.avatar as author_avatar, p.title as problem_title
       FROM shared_codes sc
       JOIN users u ON sc.user_id = u.id
       LEFT JOIN problems p ON sc.problem_id = p.id
       ${where}
       ORDER BY ${orderMap[sort as string] || orderMap.newest}
       LIMIT $${pc++} OFFSET $${pc++}`,
    [...params, parseInt(limit as string), offset]
  )

  const userId = req.userId
  const data = await Promise.all(result.rows.map(async (row: any) => {
    if (!userId) return { ...row, isLiked: false, isPinned: false }
    const [likeRes, pinRes] = await Promise.all([
      query('SELECT 1 FROM shared_code_likes WHERE shared_code_id = $1 AND user_id = $2', [row.id, userId]),
      query('SELECT 1 FROM shared_code_pins WHERE shared_code_id = $1 AND user_id = $2', [row.id, userId]),
    ])
    return { ...row, isLiked: likeRes.rows.length > 0, isPinned: pinRes.rows.length > 0 }
  }))

  return sendSuccess(res, { codes: data, total, page: parseInt(page as string), limit: parseInt(limit as string) })
})

export const getMySharedCodes = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { page = 1, limit = 20 } = req.query
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

  const countRes = await query('SELECT COUNT(*) as total FROM shared_codes WHERE user_id = $1', [userId])
  const result = await query(
    `SELECT sc.*, p.title as problem_title FROM shared_codes sc
       LEFT JOIN problems p ON sc.problem_id = p.id
       WHERE sc.user_id = $1 ORDER BY sc.created_at DESC LIMIT $2 OFFSET $3`,
    [userId, parseInt(limit as string), offset]
  )

  return sendSuccess(res, { codes: result.rows, total: parseInt(countRes.rows[0].total), page: parseInt(page as string), limit: parseInt(limit as string) })
})

export const getSharedCodeById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  await query('UPDATE shared_codes SET views = views + 1 WHERE id = $1', [id])

  const result = await query(
    `SELECT sc.*, u.username as author_name, u.avatar as author_avatar, p.title as problem_title
       FROM shared_codes sc JOIN users u ON sc.user_id = u.id LEFT JOIN problems p ON sc.problem_id = p.id
       WHERE sc.id = $1`, [id]
  )

  if (result.rows.length === 0) {
    throw notFound('代码不存在')
  }

  const code = result.rows[0]
  if (!code.is_public && code.user_id !== userId && req.userRole !== 'admin') {
    throw forbidden('无权查看')
  }

  const [likeRes, pinRes] = await Promise.all([
    query('SELECT 1 FROM shared_code_likes WHERE shared_code_id = $1 AND user_id = $2', [id, userId]),
    query('SELECT 1 FROM shared_code_pins WHERE shared_code_id = $1 AND user_id = $2', [id, userId]),
  ])
  code.isLiked = likeRes.rows.length > 0
  code.isPinned = pinRes.rows.length > 0

  return sendSuccess(res, { code })
})

export const createSharedCode = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { problem_id, submission_id, title, description, code, language, tags, is_public } = req.body

  if (!title || !code || !language) {
    throw badRequest('标题、代码和语言为必填')
  }

  const result = await query(
    `INSERT INTO shared_codes (user_id, problem_id, submission_id, title, description, code, language, tags, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [userId, problem_id || null, submission_id || null, title, description || null, code, language,
      JSON.stringify(tags || []), is_public !== false]
  )

  return sendSuccess(res, { code: result.rows[0] }, 201)
})

export const updateSharedCode = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId
  const userRole = req.userRole
  const { title, description, code, tags, is_public } = req.body

  const existing = await query('SELECT user_id FROM shared_codes WHERE id = $1', [id])
  if (existing.rows.length === 0) throw notFound('代码不存在')
  if (existing.rows[0].user_id !== userId && userRole !== 'admin') throw forbidden('权限不足')

  const result = await query(
    `UPDATE shared_codes SET title = COALESCE($1, title), description = COALESCE($2, description),
       code = COALESCE($3, code), tags = COALESCE($4, tags), is_public = COALESCE($5, is_public),
       updated_at = NOW() WHERE id = $6 RETURNING *`,
    [title || null, description || null, code || null, tags ? JSON.stringify(tags) : null, is_public !== undefined ? is_public : null, id]
  )

  return sendSuccess(res, { code: result.rows[0] })
})

export const deleteSharedCode = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId
  const userRole = req.userRole

  const existing = await query('SELECT user_id FROM shared_codes WHERE id = $1', [id])
  if (existing.rows.length === 0) throw notFound('代码不存在')
  if (existing.rows[0].user_id !== userId && userRole !== 'admin') throw forbidden('权限不足')

  await query('DELETE FROM shared_codes WHERE id = $1', [id])
  return sendSuccess(res, { message: '已删除' })
})

export const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const existing = await query('SELECT 1 FROM shared_code_likes WHERE shared_code_id = $1 AND user_id = $2', [id, userId])
  let liked: boolean
  if (existing.rows.length > 0) {
    await query('DELETE FROM shared_code_likes WHERE shared_code_id = $1 AND user_id = $2', [id, userId])
    await query('UPDATE shared_codes SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1', [id])
    liked = false
  } else {
    await query('INSERT INTO shared_code_likes (shared_code_id, user_id) VALUES ($1, $2)', [id, userId])
    await query('UPDATE shared_codes SET like_count = like_count + 1 WHERE id = $1', [id])
    liked = true
  }

  const code = await query('SELECT like_count FROM shared_codes WHERE id = $1', [id])
  return sendSuccess(res, { liked, like_count: code.rows[0].like_count })
})

export const togglePin = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const existing = await query('SELECT 1 FROM shared_code_pins WHERE shared_code_id = $1 AND user_id = $2', [id, userId])
  let pinned: boolean
  if (existing.rows.length > 0) {
    await query('DELETE FROM shared_code_pins WHERE shared_code_id = $1 AND user_id = $2', [id, userId])
    await query('UPDATE shared_codes SET pin_count = GREATEST(pin_count - 1, 0) WHERE id = $1', [id])
    pinned = false
  } else {
    await query('INSERT INTO shared_code_pins (shared_code_id, user_id) VALUES ($1, $2)', [id, userId])
    await query('UPDATE shared_codes SET pin_count = pin_count + 1 WHERE id = $1', [id])
    pinned = true
  }

  const code = await query('SELECT pin_count FROM shared_codes WHERE id = $1', [id])
  return sendSuccess(res, { pinned, pin_count: code.rows[0].pin_count })
})

export const getComments = asyncHandler(async (req, res) => {
  const { id } = req.params
  const result = await query(
    `SELECT c.*, u.username, u.avatar FROM shared_code_comments c
       JOIN users u ON c.user_id = u.id WHERE c.shared_code_id = $1 ORDER BY c.created_at ASC`, [id]
  )

  const map = new Map<number, any>()
  const roots: any[] = []
  result.rows.forEach((r: any) => { r.replies = []; map.set(r.id, r) })
  result.rows.forEach((r: any) => { r.parent_id && map.has(r.parent_id) ? map.get(r.parent_id).replies.push(r) : roots.push(r) })

  return sendSuccess(res, { comments: roots })
})

export const createComment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId
  const { content, parent_id } = req.body

  if (!content) throw badRequest('评论不能为空')

  const result = await query(
    `INSERT INTO shared_code_comments (shared_code_id, user_id, parent_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, userId, parent_id || null, content]
  )
  await query('UPDATE shared_codes SET comment_count = comment_count + 1 WHERE id = $1', [id])

  const commentWithUser = await query(
    `SELECT c.*, u.username, u.avatar FROM shared_code_comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
    [result.rows[0].id]
  )

  return sendSuccess(res, { comment: commentWithUser.rows[0] }, 201)
})

export const deleteComment = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params
  const userId = req.userId
  const userRole = req.userRole

  const existing = await query('SELECT user_id FROM shared_code_comments WHERE id = $1', [commentId])
  if (existing.rows.length === 0) throw notFound('评论不存在')
  if (existing.rows[0].user_id !== userId && userRole !== 'admin') throw forbidden('权限不足')

  await query('DELETE FROM shared_code_comments WHERE id = $1', [commentId])
  await query('UPDATE shared_codes SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1', [id])

  return sendSuccess(res, { message: '已删除' })
})

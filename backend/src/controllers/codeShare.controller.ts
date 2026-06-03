import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'

export const getSharedCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    res.json({ success: true, data: { codes: data, total, page: parseInt(page as string), limit: parseInt(limit as string) } })
  } catch (error) { next(error) }
}

export const getMySharedCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    res.json({ success: true, data: { codes: result.rows, total: parseInt(countRes.rows[0].total), page: parseInt(page as string), limit: parseInt(limit as string) } })
  } catch (error) { next(error) }
}

export const getSharedCodeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    await query('UPDATE shared_codes SET views = views + 1 WHERE id = $1', [id])

    const result = await query(
      `SELECT sc.*, u.username as author_name, u.avatar as author_avatar, p.title as problem_title
       FROM shared_codes sc JOIN users u ON sc.user_id = u.id LEFT JOIN problems p ON sc.problem_id = p.id
       WHERE sc.id = $1`, [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '代码不存在' } })
    }

    const code = result.rows[0]
    if (!code.is_public && code.user_id !== userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, error: { message: '无权查看' } })
    }

    const [likeRes, pinRes] = await Promise.all([
      query('SELECT 1 FROM shared_code_likes WHERE shared_code_id = $1 AND user_id = $2', [id, userId]),
      query('SELECT 1 FROM shared_code_pins WHERE shared_code_id = $1 AND user_id = $2', [id, userId]),
    ])
    code.isLiked = likeRes.rows.length > 0
    code.isPinned = pinRes.rows.length > 0

    res.json({ success: true, data: { code } })
  } catch (error) { next(error) }
}

export const createSharedCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const { problem_id, submission_id, title, description, code, language, tags, is_public } = req.body

    if (!title || !code || !language) {
      return res.status(400).json({ success: false, error: { message: '标题、代码和语言为必填' } })
    }

    const result = await query(
      `INSERT INTO shared_codes (user_id, problem_id, submission_id, title, description, code, language, tags, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, problem_id || null, submission_id || null, title, description || null, code, language,
        JSON.stringify(tags || []), is_public !== false]
    )

    res.status(201).json({ success: true, data: { code: result.rows[0] } })
  } catch (error) { next(error) }
}

export const updateSharedCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId
    const userRole = req.userRole
    const { title, description, code, tags, is_public } = req.body

    const existing = await query('SELECT user_id FROM shared_codes WHERE id = $1', [id])
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: { message: '代码不存在' } })
    if (existing.rows[0].user_id !== userId && userRole !== 'admin') return res.status(403).json({ success: false, error: { message: '权限不足' } })

    const result = await query(
      `UPDATE shared_codes SET title = COALESCE($1, title), description = COALESCE($2, description),
       code = COALESCE($3, code), tags = COALESCE($4, tags), is_public = COALESCE($5, is_public),
       updated_at = NOW() WHERE id = $6 RETURNING *`,
      [title || null, description || null, code || null, tags ? JSON.stringify(tags) : null, is_public !== undefined ? is_public : null, id]
    )

    res.json({ success: true, data: { code: result.rows[0] } })
  } catch (error) { next(error) }
}

export const deleteSharedCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId
    const userRole = req.userRole

    const existing = await query('SELECT user_id FROM shared_codes WHERE id = $1', [id])
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: { message: '代码不存在' } })
    if (existing.rows[0].user_id !== userId && userRole !== 'admin') return res.status(403).json({ success: false, error: { message: '权限不足' } })

    await query('DELETE FROM shared_codes WHERE id = $1', [id])
    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) { next(error) }
}

export const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
    res.json({ success: true, data: { liked, like_count: code.rows[0].like_count } })
  } catch (error) { next(error) }
}

export const togglePin = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
    res.json({ success: true, data: { pinned, pin_count: code.rows[0].pin_count } })
  } catch (error) { next(error) }
}

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT c.*, u.username, u.avatar FROM shared_code_comments c
       JOIN users u ON c.user_id = u.id WHERE c.shared_code_id = $1 ORDER BY c.created_at ASC`, [id]
    )

    const map = new Map<number, any>()
    const roots: any[] = []
    result.rows.forEach((r: any) => { r.replies = []; map.set(r.id, r) })
    result.rows.forEach((r: any) => { r.parent_id && map.has(r.parent_id) ? map.get(r.parent_id).replies.push(r) : roots.push(r) })

    res.json({ success: true, data: { comments: roots } })
  } catch (error) { next(error) }
}

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId
    const { content, parent_id } = req.body

    if (!content) return res.status(400).json({ success: false, error: { message: '评论不能为空' } })

    const result = await query(
      `INSERT INTO shared_code_comments (shared_code_id, user_id, parent_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, userId, parent_id || null, content]
    )
    await query('UPDATE shared_codes SET comment_count = comment_count + 1 WHERE id = $1', [id])

    const commentWithUser = await query(
      `SELECT c.*, u.username, u.avatar FROM shared_code_comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [result.rows[0].id]
    )

    res.status(201).json({ success: true, data: { comment: commentWithUser.rows[0] } })
  } catch (error) { next(error) }
}

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, commentId } = req.params
    const userId = req.userId
    const userRole = req.userRole

    const existing = await query('SELECT user_id FROM shared_code_comments WHERE id = $1', [commentId])
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: { message: '评论不存在' } })
    if (existing.rows[0].user_id !== userId && userRole !== 'admin') return res.status(403).json({ success: false, error: { message: '权限不足' } })

    await query('DELETE FROM shared_code_comments WHERE id = $1', [commentId])
    await query('UPDATE shared_codes SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1', [id])

    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) { next(error) }
}

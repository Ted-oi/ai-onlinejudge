import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'

export const getDiscussions = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    res.json({ success: true, data: { discussions: result.rows } })
  } catch (error) {
    next(error)
  }
}

export const createDiscussion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId } = req.params
    const userId = (req as any).userId
    const { title, content } = req.body

    const result = await query(
      `INSERT INTO discussions (problem_id, user_id, title, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [problemId, userId, title, content]
    )

    res.status(201).json({ success: true, data: { discussion: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const getDiscussion = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      return res.status(404).json({ success: false, error: { message: '讨论不存在' } })
    }

    const replies = await query(
      `SELECT r.*, u.username, u.avatar
       FROM discussion_replies r
       JOIN users u ON r.user_id = u.id
       WHERE r.discussion_id = $1
       ORDER BY r.created_at ASC`,
      [id]
    )

    res.json({
      success: true,
      data: { discussion: result.rows[0], replies: replies.rows }
    })
  } catch (error) {
    next(error)
  }
}

export const updateDiscussion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const userRole = (req as any).userRole
    const { title, content, is_pinned } = req.body

    if (is_pinned !== undefined && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    const existing = await query('SELECT user_id FROM discussions WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '讨论不存在' } })
    }

    if (existing.rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    const result = await query(
      `UPDATE discussions SET title = COALESCE($1, title), content = COALESCE($2, content),
       is_pinned = COALESCE($3, is_pinned), updated_at = NOW() WHERE id = $4 RETURNING *`,
      [title || null, content || null, is_pinned !== undefined ? is_pinned : null, id]
    )

    res.json({ success: true, data: { discussion: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const deleteDiscussion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const userRole = (req as any).userRole

    const existing = await query('SELECT user_id FROM discussions WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '讨论不存在' } })
    }

    if (existing.rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    await query('DELETE FROM discussions WHERE id = $1', [id])

    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) {
    next(error)
  }
}

export const createReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
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

    res.status(201).json({ success: true, data: { reply: replyWithUser.rows[0] } })
  } catch (error) {
    next(error)
  }
}

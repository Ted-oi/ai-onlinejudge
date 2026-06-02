import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'
import { createNotification } from './notification.controller'

// ========== CRUD ==========

export const getArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, tags, search, problem_id, author_id, page = 1, limit = 20, sort = 'newest' } = req.query

    // Build WHERE conditions
    const conditions = ["a.status = 'approved'"]
    const params: any[] = []
    let pc = 1

    if (type) { conditions.push(`a.type = $${pc++}`); params.push(type) }
    if (tags) {
      const tagList = String(tags).split(',').filter(t => t)
      if (tagList.length > 0) { conditions.push(`a.tags ?| $${pc++}::text[]`); params.push(tagList) }
    }
    if (search) { conditions.push(`(a.title ILIKE $${pc} OR a.summary ILIKE $${pc} OR a.content ILIKE $${pc})`); params.push(`%${search}%`); pc++ }
    if (problem_id) { conditions.push(`a.problem_id = $${pc++}`); params.push(problem_id) }
    if (author_id) { conditions.push(`a.author_id = $${pc++}`); params.push(author_id) }

    const where = 'WHERE ' + conditions.join(' AND ')

    // Count
    const countSql = `SELECT COUNT(*) as total FROM articles a ${where}`
    const countResult = await query(countSql, params)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Fetch with joins, sort, pagination
    const orderMap: Record<string, string> = {
      newest: 'a.created_at DESC',
      most_liked: 'a.like_count DESC, a.created_at DESC',
      most_viewed: 'a.views DESC, a.created_at DESC',
    }
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    const result = await query(
      `SELECT a.*, u.username as author_name, u.avatar as author_avatar, p.title as problem_title
       FROM articles a
       JOIN users u ON a.author_id = u.id
       LEFT JOIN problems p ON a.problem_id = p.id
       ${where}
       ORDER BY a.is_pinned DESC, ${orderMap[sort as string] || orderMap.newest}
       LIMIT $${pc++} OFFSET $${pc++}`,
      [...params, parseInt(limit as string), offset]
    )

    // Check like/favorite status for current user
    const userId = (req as any).userId
    const articlesWithStatus = await Promise.all(result.rows.map(async (a: any) => {
      if (!userId) return { ...a, isLiked: false, isFavorited: false }
      const [likeRes, favRes] = await Promise.all([
        query('SELECT 1 FROM article_likes WHERE article_id = $1 AND user_id = $2', [a.id, userId]),
        query('SELECT 1 FROM article_favorites WHERE article_id = $1 AND user_id = $2', [a.id, userId]),
      ])
      return { ...a, isLiked: likeRes.rows.length > 0, isFavorited: favRes.rows.length > 0 }
    }))

    res.json({
      success: true,
      data: {
        articles: articlesWithStatus,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getArticleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const userRole = (req as any).userRole

    await query('UPDATE articles SET views = views + 1 WHERE id = $1', [id])

    const result = await query(
      `SELECT a.*, u.username as author_name, u.avatar as author_avatar,
        p.title as problem_title
       FROM articles a
       JOIN users u ON a.author_id = u.id
       LEFT JOIN problems p ON a.problem_id = p.id
       WHERE a.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '文章不存在' } })
    }

    const article = result.rows[0]

    // Only allow author/admin/teacher to see non-approved articles
    if (article.status !== 'approved' && article.author_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '文章正在审核中' } })
    }

    // Check like/favorite status
    const [likeRes, favRes] = await Promise.all([
      query('SELECT 1 FROM article_likes WHERE article_id = $1 AND user_id = $2', [id, userId]),
      query('SELECT 1 FROM article_favorites WHERE article_id = $1 AND user_id = $2', [id, userId]),
    ])
    article.isLiked = likeRes.rows.length > 0
    article.isFavorited = favRes.rows.length > 0

    res.json({ success: true, data: { article } })
  } catch (error) {
    next(error)
  }
}

export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId
    const { type, title, content, summary, tags, problem_id } = req.body

    if (!type || !title || !content) {
      return res.status(400).json({ success: false, error: { message: '缺少必填字段' } })
    }
    if (type === 'solution' && !problem_id) {
      return res.status(400).json({ success: false, error: { message: '题解必须关联题目' } })
    }

    if (problem_id) {
      const probCheck = await query('SELECT id FROM problems WHERE id = $1', [problem_id])
      if (probCheck.rows.length === 0) {
        return res.status(400).json({ success: false, error: { message: '关联题目不存在' } })
      }
    }

    const result = await query(
      `INSERT INTO articles (type, title, content, summary, tags, problem_id, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [type, title, content, summary || null, JSON.stringify(tags || []), problem_id || null, userId]
    )

    res.status(201).json({ success: true, data: { article: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const userRole = (req as any).userRole
    const { title, content, summary, tags } = req.body

    const existing = await query('SELECT author_id, status FROM articles WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '文章不存在' } })
    }
    if (existing.rows[0].author_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    // Reset to pending if was rejected
    const newStatus = existing.rows[0].status === 'rejected' ? 'pending' : existing.rows[0].status
    const clearReject = existing.rows[0].status === 'rejected'
      ? ', reject_reason = NULL, reviewer_id = NULL, reviewed_at = NULL' : ''

    const result = await query(
      `UPDATE articles SET title = COALESCE($1, title), content = COALESCE($2, content),
       summary = COALESCE($3, summary), tags = COALESCE($4, tags),
       status = $5, updated_at = NOW()${clearReject}
       WHERE id = $6 RETURNING *`,
      [title || null, content || null, summary || null,
        tags ? JSON.stringify(tags) : null, newStatus, id]
    )

    res.json({ success: true, data: { article: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const userRole = (req as any).userRole

    const existing = await query('SELECT author_id FROM articles WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '文章不存在' } })
    }
    if (existing.rows[0].author_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    await query('DELETE FROM articles WHERE id = $1', [id])
    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) {
    next(error)
  }
}

// ========== Like / Favorite ==========

export const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const existing = await query(
      'SELECT 1 FROM article_likes WHERE article_id = $1 AND user_id = $2',
      [id, userId]
    )

    let liked: boolean
    if (existing.rows.length > 0) {
      await query('DELETE FROM article_likes WHERE article_id = $1 AND user_id = $2', [id, userId])
      await query('UPDATE articles SET like_count = like_count - 1 WHERE id = $1', [id])
      liked = false
    } else {
      await query('INSERT INTO article_likes (article_id, user_id) VALUES ($1, $2)', [id, userId])
      await query('UPDATE articles SET like_count = like_count + 1 WHERE id = $1', [id])
      liked = true
    }

    const article = await query('SELECT like_count FROM articles WHERE id = $1', [id])
    res.json({ success: true, data: { liked, like_count: article.rows[0].like_count } })
  } catch (error) {
    next(error)
  }
}

export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const existing = await query(
      'SELECT 1 FROM article_favorites WHERE article_id = $1 AND user_id = $2',
      [id, userId]
    )

    let favorited: boolean
    if (existing.rows.length > 0) {
      await query('DELETE FROM article_favorites WHERE article_id = $1 AND user_id = $2', [id, userId])
      await query('UPDATE articles SET favorite_count = favorite_count - 1 WHERE id = $1', [id])
      favorited = false
    } else {
      await query('INSERT INTO article_favorites (article_id, user_id) VALUES ($1, $2)', [id, userId])
      await query('UPDATE articles SET favorite_count = favorite_count + 1 WHERE id = $1', [id])
      favorited = true
    }

    const article = await query('SELECT favorite_count FROM articles WHERE id = $1', [id])
    res.json({ success: true, data: { favorited, favorite_count: article.rows[0].favorite_count } })
  } catch (error) {
    next(error)
  }
}

export const getUserFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId
    const { page = 1, limit = 20 } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const result = await query(
      `SELECT a.*, u.username as author_name, u.avatar as author_avatar,
        p.title as problem_title
       FROM article_favorites af
       JOIN articles a ON af.article_id = a.id
       JOIN users u ON a.author_id = u.id
       LEFT JOIN problems p ON a.problem_id = p.id
       WHERE af.user_id = $1 AND a.status = 'approved'
       ORDER BY af.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit as string), offset]
    )

    const countResult = await query(
      `SELECT COUNT(*) as total FROM article_favorites af
       JOIN articles a ON af.article_id = a.id
       WHERE af.user_id = $1 AND a.status = 'approved'`,
      [userId]
    )

    res.json({
      success: true,
      data: {
        articles: result.rows.map((a: any) => ({ ...a, isFavorited: true })),
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    })
  } catch (error) {
    next(error)
  }
}

// ========== Comments ==========

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query(
      `SELECT c.*, u.username, u.avatar
       FROM article_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.article_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    )

    // Build nested structure
    const commentMap = new Map<number, any>()
    const roots: any[] = []
    result.rows.forEach((row: any) => {
      row.replies = []
      commentMap.set(row.id, row)
    })
    result.rows.forEach((row: any) => {
      if (row.parent_id && commentMap.has(row.parent_id)) {
        commentMap.get(row.parent_id).replies.push(row)
      } else {
        roots.push(row)
      }
    })

    res.json({ success: true, data: { comments: roots } })
  } catch (error) {
    next(error)
  }
}

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const { content, parent_id } = req.body

    if (!content) {
      return res.status(400).json({ success: false, error: { message: '评论内容不能为空' } })
    }

    const result = await query(
      `INSERT INTO article_comments (article_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, userId, parent_id || null, content]
    )

    await query('UPDATE articles SET comment_count = comment_count + 1, updated_at = NOW() WHERE id = $1', [id])

    const commentWithUser = await query(
      `SELECT c.*, u.username, u.avatar FROM article_comments c
       JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [result.rows[0].id]
    )

    res.status(201).json({ success: true, data: { comment: commentWithUser.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params
    const userId = (req as any).userId
    const userRole = (req as any).userRole
    const { content } = req.body

    const existing = await query('SELECT user_id FROM article_comments WHERE id = $1', [commentId])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '评论不存在' } })
    }
    if (existing.rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    const result = await query(
      'UPDATE article_comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [content, commentId]
    )

    const commentWithUser = await query(
      `SELECT c.*, u.username, u.avatar FROM article_comments c
       JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [commentId]
    )

    res.json({ success: true, data: { comment: commentWithUser.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, commentId } = req.params
    const userId = (req as any).userId
    const userRole = (req as any).userRole

    const existing = await query('SELECT user_id FROM article_comments WHERE id = $1', [commentId])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '评论不存在' } })
    }
    if (existing.rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    await query('DELETE FROM article_comments WHERE id = $1', [commentId])
    await query('UPDATE articles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1', [id])

    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) {
    next(error)
  }
}

// ========== Admin Review ==========

export const getPendingArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const result = await query(
      `SELECT a.*, u.username as author_name, u.avatar as author_avatar,
        p.title as problem_title
       FROM articles a
       JOIN users u ON a.author_id = u.id
       LEFT JOIN problems p ON a.problem_id = p.id
       WHERE a.status = 'pending'
       ORDER BY a.created_at ASC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit as string), offset]
    )

    const countResult = await query(
      "SELECT COUNT(*) as total FROM articles WHERE status = 'pending'"
    )

    res.json({
      success: true,
      data: {
        articles: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    })
  } catch (error) {
    next(error)
  }
}

export const reviewArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const reviewerId = (req as any).userId
    const { status, reject_reason } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: '无效的审核状态' } })
    }

    const result = await query(
      `UPDATE articles SET status = $1, reviewer_id = $2, reviewed_at = NOW(),
       reject_reason = $3, updated_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [status, reviewerId, status === 'rejected' ? reject_reason || null : null, id]
    )

    if (result.rows.length === 0) {
      return res.status(409).json({ success: false, error: { message: '文章不存在或已被审核' } })
    }

    const article = result.rows[0]

    // Notify author
    if (status === 'approved') {
      await createNotification(
        article.author_id, 'article_approved',
        '文章审核通过',
        `您的文章《${article.title}》已审核通过`,
        `/articles/${article.id}`
      )
    } else {
      await createNotification(
        article.author_id, 'article_rejected',
        '文章审核未通过',
        `您的文章《${article.title}》未通过审核${reject_reason ? '，原因：' + reject_reason : ''}`,
        `/articles/${article.id}`
      )
    }

    res.json({ success: true, data: { article } })
  } catch (error) {
    next(error)
  }
}

// ========== Helpers ==========

export const getArticleTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      "SELECT DISTINCT jsonb_array_elements_text(tags) as tag FROM articles WHERE status = 'approved' AND tags != '[]'::jsonb"
    )
    const tags = [...new Set(result.rows.map((r: any) => r.tag).filter(Boolean))]
    res.json({ success: true, data: { tags } })
  } catch (error) {
    next(error)
  }
}

export const getUserArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId
    const { page = 1, limit = 20, status } = req.query

    const conditions = ['a.author_id = $1']
    const params: any[] = [userId]
    let pc = 2

    if (status) { conditions.push(`a.status = $${pc++}`); params.push(status) }

    const where = 'WHERE ' + conditions.join(' AND ')

    const countResult = await query(`SELECT COUNT(*) as total FROM articles a ${where}`, params)
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const result = await query(
      `SELECT a.*, u.username as author_name, u.avatar as author_avatar, p.title as problem_title
       FROM articles a
       JOIN users u ON a.author_id = u.id
       LEFT JOIN problems p ON a.problem_id = p.id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${pc++} OFFSET $${pc++}`,
      [...params, parseInt(limit as string), offset]
    )

    res.json({
      success: true,
      data: {
        articles: result.rows,
        total: parseInt(countResult.rows[0]?.total || '0'),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    })
  } catch (error) {
    next(error)
  }
}

import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId
    const { unread, page = 1, limit = 20 } = req.query

    let queryText = 'SELECT * FROM notifications WHERE user_id = $1'
    const params: any[] = [userId]
    let paramCount = 2

    if (unread === 'true') {
      queryText += ` AND is_read = false`
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    const countResult = await query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
      [userId]
    )

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId

    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    )

    res.json({
      success: true,
      data: { count: parseInt(result.rows[0].count) }
    })
  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId
    const { id } = req.params

    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    res.json({ success: true, data: { message: '已标记为已读' } })
  } catch (error) {
    next(error)
  }
}

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId

    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    )

    res.json({ success: true, data: { message: '已全部标记为已读' } })
  } catch (error) {
    next(error)
  }
}

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  content: string,
  link?: string
) {
  try {
    await query(
      'INSERT INTO notifications (user_id, type, title, content, link) VALUES ($1, $2, $3, $4, $5)',
      [userId, type, title, content, link || null]
    )
  } catch (error) {
    logger.error('Create notification error', error)
  }
}

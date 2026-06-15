import { query } from '../config/database'
import { logger } from '../utils/logger'
import { emitToUser } from '../services/ws.service'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.userId
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

  return sendSuccess(res, {
    notifications: result.rows,
    total: parseInt(countResult.rows[0].total),
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  })
})

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.userId

  const result = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  )

  return sendSuccess(res, { count: parseInt(result.rows[0].count) })
})

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { id } = req.params

  await query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
    [id, userId]
  )

  return sendSuccess(res, { message: '已标记为已读' })
})

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId

  await query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [userId]
  )

  return sendSuccess(res, { message: '已全部标记为已读' })
})

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
    emitToUser(userId, 'notification:new', { type, title, content, link })
  } catch (error) {
    logger.error('Create notification error', error)
  }
}

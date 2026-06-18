import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendSuccessWithMessage } from '../utils/apiResponse'
import { notFound, badRequest, conflict, forbidden } from '../utils/apiError'
import { createNotification } from './notification.controller'
import { getIO } from '../config/socket'

async function userSummary(id: number) {
  const r = await query(
    `SELECT id, username, avatar, rating, solved_count, bio
       FROM users WHERE id = $1`,
    [id]
  )
  return r.rows[0] || null
}

async function getOrCreateDirectConversation(a: number, b: number): Promise<number> {
  // 找到 a 和 b 同时参与的直接对话
  const existing = await query(
    `SELECT cp1.conversation_id FROM conversation_participants cp1
       JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
       JOIN conversations c ON c.id = cp1.conversation_id
       WHERE cp1.user_id = $1 AND cp2.user_id = $2
         AND c.type = 'direct'
       LIMIT 1`,
    [a, b]
  )
  if (existing.rows.length > 0) return existing.rows[0].conversation_id

  const conv = await query(
    `INSERT INTO conversations (type) VALUES ('direct') RETURNING id`
  )
  const convId = conv.rows[0].id
  await query(
    `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
    [convId, a, b]
  )
  return convId
}

export const searchUsers = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { q } = req.query
  if (!q || String(q).length < 1) {
    return sendSuccess(res, { users: [] })
  }

  const rows = (await query(
    `SELECT id, username, avatar, rating, solved_count
       FROM users
       WHERE id <> $1 AND (username ILIKE $2 OR email ILIKE $2)
       ORDER BY
         CASE
           WHEN username ILIKE $3 THEN 0
           WHEN username ILIKE $2 THEN 1
           ELSE 2
         END,
         rating DESC
       LIMIT 20`,
    [userId, `%${q}%`, `${q}`]
  )).rows
  return sendSuccess(res, { users: rows })
})

export const sendRequest = asyncHandler(async (req, res) => {
  const requesterId = req.userId
  const { addressee_id } = req.body
  const message = (req.body.message || '').toString().slice(0, 200)

  if (!addressee_id) throw badRequest('请指定好友对象')
  if (Number(addressee_id) === requesterId) throw badRequest('不能添加自己为好友')

  const target = await userSummary(addressee_id)
  if (!target) throw notFound('用户不存在')

  // 检查反向好友关系：对方可能已经发过请求
  const reverse = await query(
    `SELECT id, status FROM friendships
       WHERE requester_id = $1 AND addressee_id = $2`,
    [addressee_id, requesterId]
  )
  if (reverse.rows.length > 0) {
    const rev = reverse.rows[0]
    if (rev.status === 'accepted') throw conflict('已经是好友')
    if (rev.status === 'pending') {
      // 对方向我请求时，自动接受
      await query(
        `UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [rev.id]
      )
      await createNotification(
        addressee_id, 'friend_accepted', '好友请求已接受',
        `${(await userSummary(requesterId))?.username} 接受了你的好友请求`,
        `/friends`
      )
      return sendSuccessWithMessage(res, '已接受对方的好友请求', { status: 'accepted' })
    }
    if (rev.status === 'declined') {
      // 复活为 pending
      await query(
        `UPDATE friendships SET requester_id = $1, addressee_id = $2,
            status = 'pending', message = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4`,
        [requesterId, addressee_id, message, rev.id]
      )
      return sendSuccessWithMessage(res, '好友请求已重新发送', null)
    }
  }

  try {
    await query(
      `INSERT INTO friendships (requester_id, addressee_id, message)
       VALUES ($1, $2, $3)`,
      [requesterId, addressee_id, message]
    )
  } catch (e: any) {
    if (e.code === '23505') {
      // 自己已经发过：更新状态
      await query(
        `UPDATE friendships SET status = 'pending', message = $3, updated_at = CURRENT_TIMESTAMP
          WHERE requester_id = $1 AND addressee_id = $2`,
        [requesterId, addressee_id, message]
      )
    } else {
      throw e
    }
  }

  await createNotification(
    addressee_id, 'friend_request', '收到好友请求',
    `${(await userSummary(requesterId))?.username} 想加你为好友`,
    `/friends`
  )

  const io = getIO()
  io?.to(`user:${addressee_id}`).emit('friend:request', { from: requesterId })

  return sendSuccessWithMessage(res, '好友请求已发送', null, 201)
})

export const respondRequest = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { id } = req.params
  const { action } = req.body // 'accept' | 'decline'
  if (!['accept', 'decline'].includes(action)) throw badRequest('无效的操作')

  const result = await query(
    `SELECT requester_id, addressee_id, status FROM friendships WHERE id = $1`,
    [id]
  )
  if (result.rows.length === 0) throw notFound('请求不存在')
  const r = result.rows[0]
  if (r.addressee_id !== userId) throw forbidden('无权处理该请求')
  if (r.status !== 'pending') throw badRequest('该请求已被处理')

  const newStatus = action === 'accept' ? 'accepted' : 'declined'
  await query(
    `UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [newStatus, id]
  )

  if (action === 'accept') {
    // 自动建一个直接对话
    await getOrCreateDirectConversation(r.requester_id, userId)
    await createNotification(
      r.requester_id, 'friend_accepted', '好友请求已通过',
      `${(await userSummary(userId))?.username} 接受了你的好友请求`,
      '/friends'
    )
  }

  return sendSuccessWithMessage(res,
    action === 'accept' ? '已添加好友' : '已拒绝请求',
    { status: newStatus }
  )
})

export const removeFriend = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { id } = req.params // 对方 user_id

  await query(
    `DELETE FROM friendships
       WHERE ((requester_id = $1 AND addressee_id = $2)
           OR (requester_id = $2 AND addressee_id = $1))
         AND status = 'accepted'`,
    [userId, id]
  )
  return sendSuccessWithMessage(res, '已删除好友', null)
})

export const listFriends = asyncHandler(async (req, res) => {
  const userId = req.userId

  const rows = (await query(
    `SELECT
        CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS friend_id,
        u.username, u.avatar, u.rating, u.solved_count, u.bio,
        f.updated_at AS since
       FROM friendships f
       JOIN users u ON u.id = (CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END)
       WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted'
       ORDER BY u.username`,
    [userId]
  )).rows

  return sendSuccess(res, { friends: rows })
})

export const listPendingRequests = asyncHandler(async (req, res) => {
  const userId = req.userId
  const direction = (req.query.direction as string) || 'incoming'

  if (direction === 'incoming') {
    const rows = (await query(
      `SELECT f.id, f.message, f.created_at,
              u.id AS from_id, u.username, u.avatar, u.rating, u.bio
         FROM friendships f JOIN users u ON u.id = f.requester_id
         WHERE f.addressee_id = $1 AND f.status = 'pending'
         ORDER BY f.created_at DESC`,
      [userId]
    )).rows
    return sendSuccess(res, { requests: rows })
  } else {
    const rows = (await query(
      `SELECT f.id, f.message, f.created_at, f.status,
              u.id AS to_id, u.username, u.avatar
         FROM friendships f JOIN users u ON u.id = f.addressee_id
         WHERE f.requester_id = $1 AND f.status IN ('pending', 'declined')
         ORDER BY f.created_at DESC`,
      [userId]
    )).rows
    return sendSuccess(res, { requests: rows })
  }
})

export const getFriendStatus = asyncHandler(async (req, res) => {
  const userId = req.userId
  const otherId = Number(req.params.id)

  if (otherId === userId) return sendSuccess(res, { status: 'self' })

  const r = (await query(
    `SELECT status, requester_id FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
    [userId, otherId]
  )).rows[0]

  if (!r) return sendSuccess(res, { status: 'none' })
  let status = r.status
  if (r.status === 'pending' && r.requester_id === userId) status = 'pending_outgoing'
  else if (r.status === 'pending') status = 'pending_incoming'

  return sendSuccess(res, { status })
})

// ============= 消息 =============

export const listConversations = asyncHandler(async (req, res) => {
  const userId = req.userId

  const rows = (await query(
    `SELECT
        c.id AS conversation_id,
        c.type,
        cp.last_read_at,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
        (SELECT COUNT(*)::int FROM messages m
           JOIN conversation_participants cp2 ON cp2.conversation_id = m.conversation_id
           WHERE m.conversation_id = c.id AND cp2.user_id = $1
             AND m.created_at > COALESCE(cp.last_read_at, '-infinity'::timestamptz)
             AND m.sender_id <> $1) AS unread_count,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.id, 'username', u.username, 'avatar', u.avatar,
            'rating', u.rating
          ))
          FROM conversation_participants cp3
          JOIN users u ON u.id = cp3.user_id
          WHERE cp3.conversation_id = c.id AND cp3.user_id <> $1
        ) AS participants
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       WHERE cp.user_id = $1
       ORDER BY last_message_at DESC NULLS LAST`,
    [userId]
  )).rows

  return sendSuccess(res, { conversations: rows })
})

export const getConversationMessages = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { id } = req.params
  const { before, limit = 50 } = req.query

  // 校验是会话成员
  const member = await query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [id, userId]
  )
  if (member.rows.length === 0) throw forbidden('不是该会话的成员')

  const params: any[] = [id]
  let pc = 2
  let cond = ''
  if (before) {
    cond = `AND created_at < $${pc++}`
    params.push(before)
  }
  params.push(parseInt(limit as string))

  const rows = (await query(
    `SELECT m.id, m.sender_id, m.content, m.created_at, u.username, u.avatar
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1 ${cond}
       ORDER BY m.created_at DESC
       LIMIT $${pc++}`,
    params
  )).rows

  // 反转为从旧到新
  rows.reverse()

  // 标记已读
  await query(
    `UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $1 AND user_id = $2`,
    [id, userId]
  )

  return sendSuccess(res, { messages: rows })
})

export const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { recipient_id, content, conversation_id } = req.body

  if (!content || !content.trim()) throw badRequest('消息内容不能为空')

  let convId: number | undefined = conversation_id
  if (!convId && recipient_id) {
    convId = await getOrCreateDirectConversation(userId, recipient_id)
  }
  if (!convId) throw badRequest('请指定 conversation_id 或 recipient_id')

  // 校验是会话成员
  const member = await query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [convId, userId]
  )
  if (member.rows.length === 0) throw forbidden('不是该会话的成员')

  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content)
     VALUES ($1, $2, $3) RETURNING id, created_at`,
    [convId, userId, content.trim()]
  )

  await query(
    'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [convId]
  )

  const msg = result.rows[0]
  const sender = await userSummary(userId)

  // 通知其它参与者
  const others = (await query(
    `SELECT user_id FROM conversation_participants
       WHERE conversation_id = $1 AND user_id <> $2`,
    [convId, userId]
  )).rows

  const io = getIO()
  for (const o of others) {
    io?.to(`user:${o.user_id}`).emit('message:new', {
      conversation_id: convId,
      message: { ...msg, sender_id: userId, username: sender?.username, avatar: sender?.avatar },
    })
  }

  return sendSuccess(res, { ...msg, conversation_id: convId }, 201)
})

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.userId
  const r = (await query(
    `SELECT COALESCE(SUM(
        (SELECT COUNT(*)::int FROM messages m
           WHERE m.conversation_id = cp.conversation_id
             AND m.created_at > COALESCE(cp.last_read_at, '-infinity'::timestamptz)
             AND m.sender_id <> $1)
      ), 0)::int AS unread
       FROM conversation_participants cp
       WHERE cp.user_id = $1`,
    [userId]
  )).rows[0]

  const friendReqRes = await query(
    `SELECT COUNT(*)::int AS cnt FROM friendships
       WHERE addressee_id = $1 AND status = 'pending'`,
    [userId]
  )

  return sendSuccess(res, {
    messages: r.unread || 0,
    friendRequests: friendReqRes.rows[0].cnt,
  })
})

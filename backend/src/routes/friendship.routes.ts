import { Router } from 'express'
import * as friendController from '../controllers/friendship.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// 用户搜索
router.get('/search', authenticate, friendController.searchUsers)

// 好友关系
router.get('/', authenticate, friendController.listFriends)
router.get('/requests', authenticate, friendController.listPendingRequests)
router.get('/unread', authenticate, friendController.getUnreadCount)
router.post('/request', authenticate, friendController.sendRequest)
router.post('/request/:id/respond', authenticate, friendController.respondRequest)
router.delete('/:id', authenticate, friendController.removeFriend)
router.get('/status/:id', authenticate, friendController.getFriendStatus)

// 消息
router.get('/conversations', authenticate, friendController.listConversations)
router.get('/conversations/:id/messages', authenticate, friendController.getConversationMessages)
router.post('/messages', authenticate, friendController.sendMessage)

export default router

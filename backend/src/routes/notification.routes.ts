import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import * as notificationController from '../controllers/notification.controller'

const router = Router()

router.use(authenticate)

router.get('/', notificationController.getNotifications)
router.get('/unread-count', notificationController.getUnreadCount)
router.put('/:id/read', notificationController.markAsRead)
router.put('/read-all', notificationController.markAllAsRead)

export default router

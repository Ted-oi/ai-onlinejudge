import { Router } from 'express'
import * as checkinController from '../controllers/checkin.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/today', authenticate, checkinController.getTodayStatus)
router.post('/', authenticate, checkinController.checkinToday)
router.get('/history', authenticate, checkinController.getHistory)
router.get('/calendar', authenticate, checkinController.getCalendar)

export default router

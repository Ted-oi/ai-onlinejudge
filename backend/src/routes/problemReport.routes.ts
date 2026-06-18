import { Router } from 'express'
import * as reportController from '../controllers/problemReport.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

// 用户
router.post('/', authenticate, reportController.createReport)
router.get('/my', authenticate, reportController.getMyReports)
router.get('/:id', authenticate, reportController.getReportById)

// 管理
router.get('/', authenticate, authorize('admin', 'teacher'), reportController.listReports)
router.put('/:id/review', authenticate, authorize('admin', 'teacher'), reportController.reviewReport)

export default router

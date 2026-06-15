import { Router } from 'express'
import * as statsController from '../controllers/stats.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { materialUpload } from '../config/uploads'

const router = Router()

// User-scoped stats (auth required)
router.get('/submission-trend', authenticate, statsController.getSubmissionTrend)
router.get('/difficulty-distribution', authenticate, statsController.getDifficultyDistribution)

// Admin/teacher stats
router.get('/admin-trend', authenticate, authorize('admin', 'teacher'), statsController.getAdminTrend)

// Course material upload
router.post('/materials/upload', authenticate, materialUpload.single('file'), statsController.uploadMaterial)

export default router

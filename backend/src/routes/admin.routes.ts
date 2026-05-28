import { Router } from 'express'
import * as adminController from '../controllers/admin.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate, authorize('admin'))

router.get('/stats', adminController.getDashboardStats)
router.put('/users/:id/role', adminController.updateUserRole)

export default router

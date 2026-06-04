import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import * as testgenController from '../controllers/testgen.controller'

const router = Router({ mergeParams: true })

router.post('/', authenticate, authorize('admin', 'teacher'), testgenController.generateTestCases)

export default router

import { Router } from 'express'
import * as testcaseController from '../controllers/testcase.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router({ mergeParams: true })

router.get('/', authenticate, testcaseController.getTestCases)
router.post('/', authenticate, authorize('admin', 'teacher'), testcaseController.createTestCase)
router.post('/batch', authenticate, authorize('admin', 'teacher'), testcaseController.batchCreateTestCases)
router.put('/:caseId', authenticate, authorize('admin', 'teacher'), testcaseController.updateTestCase)
router.delete('/:caseId', authenticate, authorize('admin', 'teacher'), testcaseController.deleteTestCase)

export default router

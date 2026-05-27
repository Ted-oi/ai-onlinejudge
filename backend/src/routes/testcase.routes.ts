import { Router } from 'express'
import * as testcaseController from '../controllers/testcase.controller'

const router = Router({ mergeParams: true })

router.get('/', testcaseController.getTestCases)
router.post('/', testcaseController.createTestCase)
router.post('/batch', testcaseController.batchCreateTestCases)
router.put('/:caseId', testcaseController.updateTestCase)
router.delete('/:caseId', testcaseController.deleteTestCase)

export default router

import { Router } from 'express'
import * as problemSetController from '../controllers/problemSet.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, problemSetController.getProblemSets)
router.get('/:id', authenticate, problemSetController.getProblemSetById)
router.post('/', authenticate, authorize('admin', 'teacher'), problemSetController.createProblemSet)
router.put('/:id', authenticate, authorize('admin', 'teacher'), problemSetController.updateProblemSet)
router.delete('/:id', authenticate, authorize('admin', 'teacher'), problemSetController.deleteProblemSet)
router.post('/:id/publish', authenticate, authorize('admin', 'teacher'), problemSetController.publishProblemSet)

export default router

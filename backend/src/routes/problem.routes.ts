import { Router } from 'express'
import * as problemController from '../controllers/problem.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, problemController.getProblems)
router.get('/:id', authenticate, problemController.getProblemById)
router.post('/', authenticate, authorize('admin', 'teacher'), problemController.createProblem)
router.put('/:id', authenticate, authorize('admin', 'teacher'), problemController.updateProblem)
router.delete('/:id', authenticate, authorize('admin', 'teacher'), problemController.deleteProblem)
router.post('/:id/favorite', authenticate, problemController.toggleFavorite)
router.get('/:id/favorite', authenticate, problemController.checkFavorite)

export default router
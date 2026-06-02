import { Router } from 'express'
import * as lpController from '../controllers/learningPath.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.get('/recommended', authenticate, lpController.getRecommendedPath)
router.get('/my', authenticate, lpController.getMyEnrolledPaths)
router.get('/next-problem', authenticate, lpController.getNextProblemSuggestion)
router.get('/', authenticate, lpController.getLearningPaths)
router.get('/:id', authenticate, lpController.getLearningPathById)
router.post('/', authenticate, authorize('admin', 'teacher'), lpController.createLearningPath)
router.put('/:id', authenticate, authorize('admin', 'teacher'), lpController.updateLearningPath)
router.delete('/:id', authenticate, authorize('admin', 'teacher'), lpController.deleteLearningPath)
router.post('/:id/enroll', authenticate, lpController.enrollInPath)
router.delete('/:id/enroll', authenticate, lpController.unenrollFromPath)

export default router

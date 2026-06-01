import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import * as assignmentController from '../controllers/assignment.controller'

const router = Router()

router.use(authenticate)

router.get('/courses/:courseId', assignmentController.getAssignments)
router.post('/courses/:courseId', authorize('admin', 'teacher'), assignmentController.createAssignment)
router.get('/:id', assignmentController.getAssignment)
router.put('/:id', authorize('admin', 'teacher'), assignmentController.updateAssignment)
router.delete('/:id', authorize('admin', 'teacher'), assignmentController.deleteAssignment)
router.get('/:id/progress', authorize('admin', 'teacher'), assignmentController.getAssignmentProgress)

export default router

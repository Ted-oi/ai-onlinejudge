import { Router } from 'express'
import * as courseController from '../controllers/course.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, courseController.getCourses)
router.get('/:id', authenticate, courseController.getCourseById)
router.post('/', authenticate, authorize('admin', 'teacher'), courseController.createCourse)
router.put('/:id', authenticate, authorize('admin', 'teacher'), courseController.updateCourse)
router.delete('/:id', authenticate, authorize('admin', 'teacher'), courseController.deleteCourse)

export default router
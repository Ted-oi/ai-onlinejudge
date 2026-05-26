import { Router } from 'express'
import * as lessonController from '../controllers/lesson.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// 课次路由
router.get('/courses/:courseId/lessons', authenticate, lessonController.getLessonsByCourse)
router.get('/lessons/:id', authenticate, lessonController.getLessonById)
router.post('/lessons', authenticate, lessonController.createLesson)
router.put('/lessons/:id', authenticate, lessonController.updateLesson)
router.delete('/lessons/:id', authenticate, lessonController.deleteLesson)

// 课程资源路由
router.get('/courses/:courseId/materials', authenticate, lessonController.getMaterialsByCourse)
router.get('/lessons/:lessonId/materials', authenticate, lessonController.getMaterialsByLesson)
router.post('/materials', authenticate, lessonController.createMaterial)
router.put('/materials/:id', authenticate, lessonController.updateMaterial)
router.delete('/materials/:id', authenticate, lessonController.deleteMaterial)

// 文件上传路由
router.post('/materials/upload', authenticate, lessonController.uploadMaterial)

// 学习进度路由
router.post('/lessons/:lessonId/progress', authenticate, lessonController.updateLessonProgress)
router.get('/courses/:courseId/progress', authenticate, lessonController.getCourseProgress)
router.get('/lessons/:lessonId/progress/user/:userId', authenticate, lessonController.getLessonProgressByUser)

export default router
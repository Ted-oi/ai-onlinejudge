import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'
import authRoutes from './routes/auth.routes'
import problemRoutes from './routes/problem.routes'
import submissionRoutes from './routes/submission.routes'
import aiRoutes from './routes/ai.routes'
import courseRoutes from './routes/course.routes'
import userRoutes from './routes/user.routes'
import contestRoutes from './routes/contest.routes'
import lessonRoutes from './routes/lesson.routes'
import testcaseRoutes from './routes/testcase.routes'
import adminRoutes from './routes/admin.routes'
import notificationRoutes from './routes/notification.routes'
import discussionRoutes from './routes/discussion.routes'
import assignmentRoutes from './routes/assignment.routes'
import problemSetRoutes from './routes/problemSet.routes'
import articleRoutes from './routes/article.routes'
import codeShareRoutes from './routes/codeShare.routes'
import learningPathRoutes from './routes/learningPath.routes'
import teamRoutes from './routes/team.routes'
import testgenRoutes from './routes/testgen.routes'
import playgroundRoutes from './routes/playground.routes'
import statsRoutes from './routes/stats.routes'
import * as adminController from './controllers/admin.controller'
import * as userController from './controllers/user.controller'
import * as testcaseController from './controllers/testcase.controller'
import * as plagiarismController from './controllers/plagiarism.controller'
import * as importExportController from './controllers/problemImportExport.controller'
import { createServer } from 'http'
import { initSocketIO } from './config/socket'
import { connectRedis } from './config/redis'
import { authenticate, authorize } from './middleware/auth.middleware'
import { avatarUpload, testcaseUpload, excelUpload } from './config/uploads'

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

// 静态文件服务：课程素材文件
app.use('/api/materials/files', express.static(path.join(process.cwd(), 'uploads', 'courses')))

// 静态文件服务：头像
app.use('/api/avatars', express.static(path.join(process.cwd(), 'uploads', 'avatars')))

// 头像上传（不经过 logger 中间件，所以放在前面）
app.post('/api/users/:id/avatar', authenticate, avatarUpload.single('avatar'), userController.uploadAvatar)

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api', lessonRoutes)  // 课次和资源路由
app.use('/api/users', userRoutes)
app.use('/api/contests', contestRoutes)
app.use('/api/problems/:id/test-cases', testcaseRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/discussions', discussionRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/problem-sets', problemSetRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/code-shares', codeShareRoutes)
app.use('/api/learning-paths', learningPathRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/playground', playgroundRoutes)
app.use('/api/stats', statsRoutes)

// AI test case generation
app.use('/api/problems/:id/generate-test-cases', testgenRoutes)

// Plagiarism detection
app.post('/api/plagiarism/:problemId', authenticate, authorize('admin', 'teacher'), plagiarismController.checkPlagiarism)

// Problem import/export
app.get('/api/problems-export', authenticate, authorize('admin', 'teacher'), importExportController.exportProblems)
app.post('/api/problems-import', authenticate, authorize('admin', 'teacher'), importExportController.importProblems)

// Objective question Excel import
app.get('/api/objective-template', authenticate, authorize('admin', 'teacher'), importExportController.downloadObjectiveTemplate)
app.post('/api/objective-import', authenticate, authorize('admin', 'teacher'), excelUpload.single('file'), importExportController.importObjectiveExcel)

// 测试用例文件上传（.in/.out/.zip）
app.post('/api/problems/:id/test-cases/upload', authenticate, authorize('admin', 'teacher'), testcaseUpload.array('files', 100), testcaseController.uploadTestCases)
app.use('/api/admin', adminRoutes)

// 公开统计接口
app.get('/api/stats', adminController.getPublicStats)

app.use(notFoundHandler)
app.use(errorHandler)

const server = createServer(app)
initSocketIO(server)

// Connect to Redis (falls back to memory cache if unavailable)
connectRedis().catch(() => {})

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import fs from 'fs'
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
import * as adminController from './controllers/admin.controller'
import multer from 'multer'
import { authenticate, authorize } from './middleware/auth.middleware'

const app = express()
const PORT = process.env.PORT || 5000

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    // 允许上传的文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/vnd.ms-powerpoint', // ppt
      'video/mp4', // mp4
      'video/webm', // webm
      'video/ogg', // ogg
      'application/pdf', // pdf
      'image/jpeg', // jpg, jpeg
      'image/png', // png
      'application/msword', // doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    ]
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('不支持的文件类型'))
  }
})

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

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

// 测试用例文件上传（.in/.out/.zip）
const testcaseUpload = multer({
  dest: 'uploads/temp',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase()
    if (ext.endsWith('.in') || ext.endsWith('.out') || ext.endsWith('.ans') || ext.endsWith('.zip')) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 .in / .out / .ans / .zip 文件'))
    }
  },
})
app.post('/api/problems/:id/test-cases/upload', authenticate, authorize('admin', 'teacher'), testcaseUpload.array('files', 100), (req, res, next) => {
  import('./controllers/testcase.controller').then(tc => tc.uploadTestCases(req, res, next))
})
app.use('/api/admin', adminRoutes)

// 公开统计接口
app.get('/api/stats', adminController.getPublicStats)

// 创建上传目录
const uploadsDir = path.join(process.cwd(), 'uploads', 'courses')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 文件上传路由
app.post('/api/materials/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: '没有上传文件' }
    })
  }

  const fileUrl = `/uploads/courses/${req.file.filename}`

  res.json({
    success: true,
    data: {
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    }
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
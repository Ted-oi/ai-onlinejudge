import { query } from '../config/database'
import { logger } from '../utils/logger'
import fs from 'fs'
import path from 'path'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendSuccessWithMessage } from '../utils/apiResponse'
import { notFound, badRequest } from '../utils/apiError'

// 课次控制器
export const getLessonsByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params

  const result = await query(
    'SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index',
    [courseId]
  )

  // 为每个课次获取资源数量
  const lessonsWithMaterials = await Promise.all(
    result.rows.map(async (lesson: any) => {
      const materialsResult = await query(
        'SELECT COUNT(*) as count FROM course_materials WHERE lesson_id = $1',
        [lesson.id]
      )
      return {
        ...lesson,
        materials_count: materialsResult.rows[0].count
      }
    })
  )

  return sendSuccess(res, { lessons: lessonsWithMaterials })
})

export const getLessonById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query('SELECT * FROM lessons WHERE id = $1', [id])

  if (result.rows.length === 0) {
    throw notFound('课次不存在')
  }

  // 获取课次的资源
  const materialsResult = await query(
    'SELECT * FROM course_materials WHERE lesson_id = $1 ORDER BY order_index',
    [id]
  )

  return sendSuccess(res, {
    lesson: result.rows[0],
    materials: materialsResult.rows
  })
})

export const createLesson = asyncHandler(async (req, res) => {
  const { course_id, title, description, knowledge_point, order_index, duration } = req.body

  const result = await query(
    `INSERT INTO lessons (course_id, title, description, knowledge_point, order_index, duration)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
    [course_id, title, description, knowledge_point, order_index || 1, duration]
  )

  // 更新课程的课次数量
  await query(
    `UPDATE courses SET updated_at = NOW() WHERE id = $1`,
    [course_id]
  )

  return sendSuccess(res, { lesson: result.rows[0] }, 201)
})

export const updateLesson = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description, knowledge_point, order_index, duration } = req.body

  const updates: string[] = []
  const params: any[] = []
  let paramCount = 1

  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramCount++}`)
      params.push(value)
    }
  })

  if (updates.length === 0) {
    throw new Error('没有要更新的字段')
  }

  updates.push('updated_at = NOW()')
  params.push(id)

  const queryText = `UPDATE lessons SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
  const result = await query(queryText, params)

  if (result.rows.length === 0) {
    throw notFound('课次不存在')
  }

  return sendSuccess(res, { lesson: result.rows[0] })
})

export const deleteLesson = asyncHandler(async (req, res) => {
  const { id } = req.params

  // 先获取课次信息以便更新课程计数
  const lessonResult = await query('SELECT * FROM lessons WHERE id = $1', [id])

  if (lessonResult.rows.length === 0) {
    throw notFound('课次不存在')
  }

  const lesson = lessonResult.rows[0]

  // 删除课次（级联删除相关资源和进度）
  await query('DELETE FROM lessons WHERE id = $1', [id])

  // 更新课程
  await query(
    'UPDATE courses SET updated_at = NOW() WHERE id = $1',
    [lesson.course_id]
  )

  return sendSuccessWithMessage(res, '删除成功')
})

// 课程资源控制器
export const getMaterialsByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params

  const result = await query(
    `SELECT cm.*, l.title as lesson_title, l.order_index as lesson_order
       FROM course_materials cm
       LEFT JOIN lessons l ON cm.lesson_id = l.id
       WHERE cm.course_id = $1
       ORDER BY l.order_index, cm.order_index`,
    [courseId]
  )

  return sendSuccess(res, { materials: result.rows })
})

export const getMaterialsByLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params

  const result = await query(
    'SELECT * FROM course_materials WHERE lesson_id = $1 ORDER BY order_index',
    [lessonId]
  )

  return sendSuccess(res, { materials: result.rows })
})

export const createMaterial = asyncHandler(async (req, res) => {
  const { course_id, lesson_id, title, type, content, file_url, file_size, file_name, mime_type, order_index } = req.body

  const result = await query(
    `INSERT INTO course_materials (course_id, lesson_id, title, type, content, file_url, file_size, file_name, mime_type, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
    [course_id, lesson_id, title, type, content, file_url, file_size, file_name, mime_type, order_index || 1]
  )

  return sendSuccess(res, { material: result.rows[0] }, 201)
})

export const updateMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, type, content, file_url, file_size, file_name, mime_type, order_index } = req.body

  const updates: string[] = []
  const params: any[] = []
  let paramCount = 1

  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramCount++}`)
      params.push(value)
    }
  })

  if (updates.length === 0) {
    throw new Error('没有要更新的字段')
  }

  const queryText = `UPDATE course_materials SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
  const result = await query(queryText, params)

  if (result.rows.length === 0) {
    throw notFound('资源不存在')
  }

  return sendSuccess(res, { material: result.rows[0] })
})

export const deleteMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params

  const existing = await query('SELECT * FROM course_materials WHERE id = $1', [id])
  if (existing.rows.length === 0) {
    throw notFound('资源不存在')
  }

  const material = existing.rows[0]
  if (material.file_url) {
    const fileName = material.file_url.replace('/api/materials/files/', '')
    const filePath = path.join(process.cwd(), 'uploads', 'courses', fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  await query('DELETE FROM course_materials WHERE id = $1', [id])

  return sendSuccessWithMessage(res, '删除成功')
})

// 文件上传
export const uploadMaterial = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw badRequest('没有上传文件')
  }

  const { course_id, lesson_id, title } = req.body
  const mime = req.file.mimetype

  let materialType = 'document'
  if (mime.startsWith('video/')) materialType = 'video'
  else if (mime.includes('presentation') || mime.includes('powerpoint') || req.file.originalname.match(/\.(ppt|pptx)$/i)) materialType = 'ppt'
  else if (mime === 'application/pdf') materialType = 'document'

  const ext = path.extname(req.file.originalname) || ''
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
  const uploadDir = path.join(process.cwd(), 'uploads', 'courses')

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const finalPath = path.join(uploadDir, safeName)
  fs.renameSync(req.file.path, finalPath)

  const fileUrl = `/api/materials/files/${safeName}`

  const result = await query(
    `INSERT INTO course_materials (course_id, lesson_id, title, type, file_url, file_name, file_size, mime_type, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
       RETURNING *`,
    [course_id || null, lesson_id || null, title || req.file.originalname, materialType,
     fileUrl, req.file.originalname, req.file.size, mime]
  )

  return sendSuccess(res, { material: result.rows[0] })
})

// 学习进度控制器
export const updateLessonProgress = asyncHandler(async (req, res) => {
  const { lessonId } = req.params
  const userId = req.userId
  const { completed, last_position } = req.body

  // 检查是否已有进度记录
  const existingProgress = await query(
    'SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
    [userId, lessonId]
  )

  let result
  if (existingProgress.rows.length > 0) {
    // 更新现有进度
    const updates: string[] = []
    const params: any[] = []
    let paramCount = 1

    if (completed !== undefined) {
      updates.push('completed = $1')
      params.push(completed)
      if (completed) {
        updates.push('completed_at = NOW()')
        params.push()
      }
      paramCount++
    }

    if (last_position !== undefined) {
      updates.push('last_position = $1')
      params.push(last_position)
      paramCount++
    }

    updates.push('updated_at = NOW()')
    params.push(existingProgress.rows[0].id)

    const queryText = `UPDATE user_progress SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
    result = await query(queryText, params)
  } else {
    // 创建新进度记录
    result = await query(
      `INSERT INTO user_progress (user_id, lesson_id, completed, last_position)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
      [userId, lessonId, completed || false, last_position || 0]
    )
  }

  return sendSuccess(res, { progress: result.rows[0] })
})

export const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const userId = req.userId

  // 获取课程的所有课次
  const lessonsResult = await query(
    'SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index',
    [courseId]
  )

  // 获取每个课次的进度
  const progressMap: Record<number, any> = {}
  const progressResult = await query(
    'SELECT * FROM user_progress WHERE user_id = $1',
    [userId]
  )

  progressResult.rows.forEach((progress: any) => {
    progressMap[progress.lesson_id] = progress
  })

  const lessonsWithProgress = lessonsResult.rows.map((lesson: any) => ({
    ...lesson,
    completed: progressMap[lesson.id]?.completed || false,
    lastPosition: progressMap[lesson.id]?.last_position || 0
  }))

  const completedCount = lessonsWithProgress.filter((lesson: any) => lesson.completed).length
  const totalCount = lessonsWithProgress.length

  return sendSuccess(res, {
    lessons: lessonsWithProgress,
    completed_count: completedCount,
    total_count: totalCount,
    progress_percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  })
})

export const getLessonProgressByUser = asyncHandler(async (req, res) => {
  const { lessonId, userId } = req.params

  const result = await query(
    'SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
    [userId, lessonId]
  )

  if (result.rows.length === 0) {
    return sendSuccess(res, {
      completed: false,
      last_position: 0
    })
  }

  return sendSuccess(res, {
    completed: result.rows[0].completed,
    last_position: result.rows[0].last_position,
    completed_at: result.rows[0].completed_at
  })
})

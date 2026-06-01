import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'
import fs from 'fs'
import path from 'path'

// 课次控制器
export const getLessonsByCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    res.json({
      success: true,
      data: { lessons: lessonsWithMaterials }
    })
  } catch (error) {
    next(error)
  }
}

export const getLessonById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('SELECT * FROM lessons WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '课次不存在' }
      })
    }

    // 获取课次的资源
    const materialsResult = await query(
      'SELECT * FROM course_materials WHERE lesson_id = $1 ORDER BY order_index',
      [id]
    )

    res.json({
      success: true,
      data: {
        lesson: result.rows[0],
        materials: materialsResult.rows
      }
    })
  } catch (error) {
    next(error)
  }
}

export const createLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    res.status(201).json({
      success: true,
      data: { lesson: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const updateLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      return res.status(404).json({
        success: false,
        error: { message: '课次不存在' }
      })
    }

    res.json({
      success: true,
      data: { lesson: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const deleteLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // 先获取课次信息以便更新课程计数
    const lessonResult = await query('SELECT * FROM lessons WHERE id = $1', [id])

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '课次不存在' }
      })
    }

    const lesson = lessonResult.rows[0]

    // 删除课次（级联删除相关资源和进度）
    await query('DELETE FROM lessons WHERE id = $1', [id])

    // 更新课程
    await query(
      'UPDATE courses SET updated_at = NOW() WHERE id = $1',
      [lesson.course_id]
    )

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    next(error)
  }
}

// 课程资源控制器
export const getMaterialsByCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params

    const result = await query(
      `SELECT cm.*, l.title as lesson_title, l.order_index as lesson_order
       FROM course_materials cm
       LEFT JOIN lessons l ON cm.lesson_id = l.id
       WHERE cm.course_id = $1
       ORDER BY l.order_index, cm.order_index`,
      [courseId]
    )

    res.json({
      success: true,
      data: { materials: result.rows }
    })
  } catch (error) {
    next(error)
  }
}

export const getMaterialsByLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params

    const result = await query(
      'SELECT * FROM course_materials WHERE lesson_id = $1 ORDER BY order_index',
      [lessonId]
    )

    res.json({
      success: true,
      data: { materials: result.rows }
    })
  } catch (error) {
    next(error)
  }
}

export const createMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { course_id, lesson_id, title, type, content, file_url, file_size, file_name, mime_type, order_index } = req.body

    const result = await query(
      `INSERT INTO course_materials (course_id, lesson_id, title, type, content, file_url, file_size, file_name, mime_type, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [course_id, lesson_id, title, type, content, file_url, file_size, file_name, mime_type, order_index || 1]
    )

    res.status(201).json({
      success: true,
      data: { material: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const updateMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      return res.status(404).json({
        success: false,
        error: { message: '资源不存在' }
      })
    }

    res.json({
      success: true,
      data: { material: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await query('SELECT * FROM course_materials WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '资源不存在' }
      })
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

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    next(error)
  }
}

// 文件上传
export const uploadMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: '没有上传文件' }
      })
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

    res.json({
      success: true,
      data: { material: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

// 学习进度控制器
export const updateLessonProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params
    const userId = (req as any).userId
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

    res.json({
      success: true,
      data: { progress: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const getCourseProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params
    const userId = (req as any).userId

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

    res.json({
      success: true,
      data: {
        lessons: lessonsWithProgress,
        completed_count: completedCount,
        total_count: totalCount,
        progress_percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getLessonProgressByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId, userId } = req.params

    const result = await query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    )

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          completed: false,
          last_position: 0
        }
      })
    }

    res.json({
      success: true,
      data: {
        completed: result.rows[0].completed,
        last_position: result.rows[0].last_position,
        completed_at: result.rows[0].completed_at
      }
    })
  } catch (error) {
    next(error)
  }
}
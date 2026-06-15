import { query } from '../config/database'
import { logger } from '../utils/logger'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendSuccessWithMessage } from '../utils/apiResponse'
import { notFound } from '../utils/apiError'

export const getCourses = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query

  let queryText = 'SELECT * FROM courses WHERE 1=1'
  const params: any[] = []
  let paramCount = 1

  if (category) {
    queryText += ` AND category = $${paramCount++}`
    params.push(category)
  }

  if (search) {
    queryText += ` AND (title ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`
    params.push(`%${search}%`, `%${search}%`)
  }

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
  queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
  params.push(parseInt(limit as string), offset)

  const result = await query(queryText, params)

  return sendSuccess(res, { courses: result.rows })
})

export const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const result = await query('SELECT * FROM courses WHERE id = $1', [id])

  if (result.rows.length === 0) {
    throw notFound('课程不存在')
  }

  const course = result.rows[0]

  const materialsResult = await query(
    'SELECT * FROM course_materials WHERE course_id = $1 ORDER BY order_index',
    [id]
  )

  // Fetch associated problem set with progress
  let problemSet: any = null
  if (course.problem_set_id) {
    const psResult = await query(
      'SELECT id, title, description, category, difficulty, cover_color, problem_ids FROM problem_sets WHERE id = $1',
      [course.problem_set_id]
    )
    if (psResult.rows.length > 0) {
      const ps = psResult.rows[0]
      const pids: number[] = ps.problem_ids || []
      let solvedCount = 0
      if (userId && pids.length > 0) {
        const solvedResult = await query(
          `SELECT COUNT(DISTINCT problem_id) as cnt FROM submissions
             WHERE user_id = $1 AND status = 'accepted' AND problem_id = ANY($2::int[])`,
          [userId, pids]
        )
        solvedCount = parseInt(solvedResult.rows[0].cnt)
      }
      problemSet = {
        ...ps,
        total_count: pids.length,
        solved_count: solvedCount,
        percentage: pids.length > 0 ? Math.round((solvedCount / pids.length) * 100) : 0,
      }
    }
  }

  return sendSuccess(res, {
    course,
    materials: materialsResult.rows,
    problemSet,
  })
})

export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, instructor_id } = req.body

  const result = await query(
    `INSERT INTO courses (title, description, category, instructor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
    [title, description, category, instructor_id]
  )

  return sendSuccess(res, { course: result.rows[0] }, 201)
})

export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description, category } = req.body

  const result = await query(
    `UPDATE courses
       SET title = $1, description = $2, category = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
    [title, description, category, id]
  )

  if (result.rows.length === 0) {
    throw notFound('课程不存在')
  }

  return sendSuccess(res, { course: result.rows[0] })
})

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query('DELETE FROM courses WHERE id = $1 RETURNING *', [id])

  if (result.rows.length === 0) {
    throw notFound('课程不存在')
  }

  return sendSuccessWithMessage(res, '删除成功')
})

export const updateCourseProblemSet = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { problem_set_id } = req.body

  const result = await query(
    `UPDATE courses SET problem_set_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [problem_set_id || null, id]
  )

  if (result.rows.length === 0) {
    throw notFound('课程不存在')
  }

  return sendSuccess(res, { course: result.rows[0] })
})

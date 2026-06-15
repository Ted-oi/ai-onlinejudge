import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { notFound } from '../utils/apiError'

export const getAssignments = asyncHandler(async (req, res) => {
  const { courseId } = req.params

  const result = await query(
    `SELECT a.*, u.username as creator_name
       FROM assignments a
       JOIN users u ON a.creator_id = u.id
       WHERE a.course_id = $1
       ORDER BY a.end_time DESC`,
    [courseId]
  )

  return sendSuccess(res, { assignments: result.rows })
})

export const createAssignment = asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const userId = req.userId
  const { title, description, problem_ids, lesson_id, start_time, end_time } = req.body

  const result = await query(
    `INSERT INTO assignments (course_id, lesson_id, title, description, problem_ids, start_time, end_time, creator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [courseId, lesson_id || null, title, description || null, JSON.stringify(problem_ids || []),
     start_time, end_time, userId]
  )

  return sendSuccess(res, { assignment: result.rows[0] }, 201)
})

export const getAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const result = await query(
    `SELECT a.*, u.username as creator_name FROM assignments a
       JOIN users u ON a.creator_id = u.id WHERE a.id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw notFound('作业不存在')
  }

  const assignment = result.rows[0]

  const problems = await query(
    `SELECT p.id, p.title, p.difficulty, p.category FROM problems p
       WHERE p.id = ANY($1::int[])`,
    [assignment.problem_ids || []]
  )

  const mySubmissions = await query(
    `SELECT asm.problem_id, s.status, s.created_at
       FROM assignment_submissions asm
       JOIN submissions s ON asm.submission_id = s.id
       WHERE asm.assignment_id = $1 AND asm.user_id = $2`,
    [id, userId]
  )

  return sendSuccess(res, { assignment, problems: problems.rows, mySubmissions: mySubmissions.rows })
})

export const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description, problem_ids, start_time, end_time } = req.body

  const result = await query(
    `UPDATE assignments SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       problem_ids = COALESCE($3, problem_ids),
       start_time = COALESCE($4, start_time),
       end_time = COALESCE($5, end_time),
       updated_at = NOW()
       WHERE id = $6 RETURNING *`,
    [title || null, description || null, problem_ids ? JSON.stringify(problem_ids) : null,
     start_time || null, end_time || null, id]
  )

  if (result.rows.length === 0) {
    throw notFound('作业不存在')
  }

  return sendSuccess(res, { assignment: result.rows[0] })
})

export const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query('DELETE FROM assignments WHERE id = $1 RETURNING id', [id])

  if (result.rows.length === 0) {
    throw notFound('作业不存在')
  }

  return sendSuccess(res, { message: '已删除' })
})

export const getAssignmentProgress = asyncHandler(async (req, res) => {
  const { id } = req.params

  const assignment = await query('SELECT * FROM assignments WHERE id = $1', [id])
  if (assignment.rows.length === 0) {
    throw notFound('作业不存在')
  }

  const progress = await query(
    `SELECT u.id as user_id, u.username, u.avatar,
        COUNT(DISTINCT asm.problem_id) as solved_count,
        array_agg(DISTINCT asm.problem_id) as solved_problems
       FROM users u
       LEFT JOIN assignment_submissions asm ON asm.user_id = u.id AND asm.assignment_id = $1
       LEFT JOIN submissions s ON asm.submission_id = s.id AND s.status = 'accepted'
       WHERE u.role = 'student'
       GROUP BY u.id, u.username, u.avatar
       ORDER BY solved_count DESC`,
    [id]
  )

  return sendSuccess(res, {
    total_problems: (assignment.rows[0].problem_ids || []).length,
    progress: progress.rows
  })
})

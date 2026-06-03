import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params

    const result = await query(
      `SELECT a.*, u.username as creator_name
       FROM assignments a
       JOIN users u ON a.creator_id = u.id
       WHERE a.course_id = $1
       ORDER BY a.end_time DESC`,
      [courseId]
    )

    res.json({ success: true, data: { assignments: result.rows } })
  } catch (error) {
    next(error)
  }
}

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params
    const userId = req.userId
    const { title, description, problem_ids, lesson_id, start_time, end_time } = req.body

    const result = await query(
      `INSERT INTO assignments (course_id, lesson_id, title, description, problem_ids, start_time, end_time, creator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [courseId, lesson_id || null, title, description || null, JSON.stringify(problem_ids || []),
       start_time, end_time, userId]
    )

    res.status(201).json({ success: true, data: { assignment: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const getAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await query(
      `SELECT a.*, u.username as creator_name FROM assignments a
       JOIN users u ON a.creator_id = u.id WHERE a.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '作业不存在' } })
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

    res.json({
      success: true,
      data: { assignment, problems: problems.rows, mySubmissions: mySubmissions.rows }
    })
  } catch (error) {
    next(error)
  }
}

export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      return res.status(404).json({ success: false, error: { message: '作业不存在' } })
    }

    res.json({ success: true, data: { assignment: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const deleteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('DELETE FROM assignments WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '作业不存在' } })
    }

    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) {
    next(error)
  }
}

export const getAssignmentProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const assignment = await query('SELECT * FROM assignments WHERE id = $1', [id])
    if (assignment.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '作业不存在' } })
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

    res.json({
      success: true,
      data: {
        total_problems: (assignment.rows[0].problem_ids || []).length,
        progress: progress.rows
      }
    })
  } catch (error) {
    next(error)
  }
}

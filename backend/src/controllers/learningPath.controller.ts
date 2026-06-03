import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { getNextProblem, recommendPath } from '../services/recommendation.service'

export const getLearningPaths = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, page = 1, limit = 20 } = req.query
    const userId = req.userId

    const conditions = ["is_published = TRUE"]
    const params: any[] = []
    let pc = 1

    if (category) { conditions.push(`category = $${pc++}`); params.push(category) }
    const where = 'WHERE ' + conditions.join(' AND ')

    const countRes = await query(`SELECT COUNT(*) as total FROM learning_paths ${where}`, params)
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const result = await query(
      `SELECT lp.*, u.username as creator_name,
        (SELECT COUNT(*) FROM learning_path_stages WHERE path_id = lp.id) as stage_count,
        (SELECT COUNT(DISTINCT lpp.problem_id) FROM learning_path_problems lpp
         JOIN learning_path_stages lps ON lpp.stage_id = lps.id WHERE lps.path_id = lp.id) as problem_count
       FROM learning_paths lp LEFT JOIN users u ON lp.creator_id = u.id
       ${where} ORDER BY lp.created_at DESC LIMIT $${pc++} OFFSET $${pc++}`,
      [...params, parseInt(limit as string), offset]
    )

    // Check enrollment status
    const pathsWithStatus = await Promise.all(result.rows.map(async (p: any) => {
      const enroll = await query(
        'SELECT id, completed_at FROM user_path_enrollments WHERE user_id = $1 AND path_id = $2', [userId, p.id]
      )
      p.is_enrolled = enroll.rows.length > 0
      p.is_completed = enroll.rows[0]?.completed_at != null

      if (p.is_enrolled) {
        const totalProblems = await query(
          `SELECT COUNT(DISTINCT lpp.problem_id) as cnt FROM learning_path_problems lpp
           JOIN learning_path_stages lps ON lpp.stage_id = lps.id WHERE lps.path_id = $1`, [p.id]
        )
        const solvedCount = await query(
          `SELECT COUNT(DISTINCT upp.problem_id) as cnt FROM user_path_progress upp WHERE upp.user_id = $1 AND upp.path_id = $2`, [userId, p.id]
        )
        const total = parseInt(totalProblems.rows[0].cnt)
        const solved = parseInt(solvedCount.rows[0].cnt)
        p.progress = { total_problems: total, solved_problems: solved, percentage: total > 0 ? Math.round(solved / total * 100) : 0 }
      }

      return p
    }))

    res.json({ success: true, data: { paths: pathsWithStatus, total: parseInt(countRes.rows[0].total), page: parseInt(page as string) } })
  } catch (error) { next(error) }
}

export const getLearningPathById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const pathRes = await query('SELECT * FROM learning_paths WHERE id = $1', [id])
    if (pathRes.rows.length === 0) return res.status(404).json({ success: false, error: { message: '路径不存在' } })

    const stages = await query(
      `SELECT * FROM learning_path_stages WHERE path_id = $1 ORDER BY order_index`, [id]
    )

    const solvedRes = await query(
      `SELECT DISTINCT problem_id FROM submissions WHERE user_id = $1 AND status = 'accepted'`, [userId]
    )
    const solvedSet = new Set(solvedRes.rows.map((r: any) => r.problem_id))

    const stagesWithProblems = await Promise.all(stages.rows.map(async (stage: any) => {
      const problems = await query(
        `SELECT lpp.problem_id, lpp.is_required, lpp.order_index, p.title, p.difficulty, p.category
         FROM learning_path_problems lpp JOIN problems p ON lpp.problem_id = p.id
         WHERE lpp.stage_id = $1 ORDER BY lpp.order_index`, [stage.id]
      )
      stage.problems = problems.rows.map((p: any) => ({ ...p, is_solved: solvedSet.has(p.problem_id) }))
      return stage
    }))

    const enroll = await query(
      'SELECT id, completed_at FROM user_path_enrollments WHERE user_id = $1 AND path_id = $2', [userId, id]
    )

    res.json({
      success: true,
      data: {
        path: pathRes.rows[0],
        stages: stagesWithProblems,
        is_enrolled: enroll.rows.length > 0,
        is_completed: enroll.rows[0]?.completed_at != null,
      }
    })
  } catch (error) { next(error) }
}

export const createLearningPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const { title, description, category, cover_color, estimated_hours, stages, is_published } = req.body

    if (!title || !category) return res.status(400).json({ success: false, error: { message: '标题和分类为必填' } })

    const pathRes = await query(
      `INSERT INTO learning_paths (title, description, category, cover_color, estimated_hours, creator_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description || null, category, cover_color || '#4f46e5', estimated_hours || null, userId, is_published || false]
    )

    const pathId = pathRes.rows[0].id

    if (stages && Array.isArray(stages)) {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i]
        const stageRes = await query(
          `INSERT INTO learning_path_stages (path_id, order_index, title, description, required_solved)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [pathId, i, stage.title, stage.description || null, stage.required_solved || 0]
        )

        if (stage.problems && Array.isArray(stage.problems)) {
          for (let j = 0; j < stage.problems.length; j++) {
            await query(
              `INSERT INTO learning_path_problems (stage_id, problem_id, order_index, is_required) VALUES ($1, $2, $3, $4)`,
              [stageRes.rows[0].id, stage.problems[j], j, true]
            )
          }
        }
      }
    }

    res.status(201).json({ success: true, data: { path: pathRes.rows[0] } })
  } catch (error) { next(error) }
}

export const updateLearningPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { title, description, category, cover_color, estimated_hours, is_published } = req.body

    const result = await query(
      `UPDATE learning_paths SET title = COALESCE($1, title), description = COALESCE($2, description),
       category = COALESCE($3, category), cover_color = COALESCE($4, cover_color),
       estimated_hours = COALESCE($5, estimated_hours), is_published = COALESCE($6, is_published),
       updated_at = NOW() WHERE id = $7 RETURNING *`,
      [title || null, description || null, category || null, cover_color || null, estimated_hours || null, is_published !== undefined ? is_published : null, id]
    )

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: '路径不存在' } })
    res.json({ success: true, data: { path: result.rows[0] } })
  } catch (error) { next(error) }
}

export const deleteLearningPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    await query('DELETE FROM learning_paths WHERE id = $1', [id])
    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) { next(error) }
}

export const enrollInPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    await query(
      `INSERT INTO user_path_enrollments (user_id, path_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, id]
    )
    res.json({ success: true, data: { message: '已加入学习路径' } })
  } catch (error) { next(error) }
}

export const unenrollFromPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId
    await query('DELETE FROM user_path_enrollments WHERE user_id = $1 AND path_id = $2', [userId, id])
    res.json({ success: true, data: { message: '已退出' } })
  } catch (error) { next(error) }
}

export const getMyEnrolledPaths = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const result = await query(
      `SELECT lp.*, upe.enrolled_at, upe.completed_at,
        (SELECT COUNT(DISTINCT lpp.problem_id) FROM learning_path_problems lpp
         JOIN learning_path_stages lps ON lpp.stage_id = lps.id WHERE lps.path_id = lp.id) as total_problems,
        (SELECT COUNT(DISTINCT upp.problem_id) FROM user_path_progress upp
         WHERE upp.user_id = $1 AND upp.path_id = lp.id) as solved_problems
       FROM user_path_enrollments upe JOIN learning_paths lp ON upe.path_id = lp.id
       WHERE upe.user_id = $1 ORDER BY upe.enrolled_at DESC`, [userId]
    )

    const paths = result.rows.map((p: any) => ({
      ...p,
      progress: {
        total_problems: p.total_problems,
        solved_problems: p.solved_problems,
        percentage: p.total_problems > 0 ? Math.round(p.solved_problems / p.total_problems * 100) : 0
      }
    }))

    res.json({ success: true, data: { paths } })
  } catch (error) { next(error) }
}

export const getNextProblemSuggestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const result = await getNextProblem(userId)
    res.json({ success: true, data: result })
  } catch (error) { next(error) }
}

export const getRecommendedPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const result = await recommendPath(userId)
    res.json({ success: true, data: result })
  } catch (error) { next(error) }
}

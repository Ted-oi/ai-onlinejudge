import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { notFound } from '../utils/apiError'

export const getProblemSets = asyncHandler(async (req, res) => {
  const { category, difficulty, search, page = 1, limit = 20 } = req.query
  const userId = req.userId
  const userRole = req.userRole

  let whereClause = 'WHERE 1=1'
  const params: any[] = []
  let paramCount = 1

  // Students only see published sets; admin/teacher see all
  if (userRole !== 'admin' && userRole !== 'teacher') {
    whereClause += ` AND is_published = true`
  }

  if (category) {
    whereClause += ` AND ps.category = $${paramCount++}`
    params.push(category)
  }

  if (difficulty) {
    whereClause += ` AND ps.difficulty = $${paramCount++}`
    params.push(difficulty)
  }

  if (search) {
    whereClause += ` AND (ps.title ILIKE $${paramCount++} OR ps.description ILIKE $${paramCount++})`
    params.push(`%${search}%`, `%${search}%`)
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM problem_sets ps ${whereClause}`,
    params
  )
  const total = parseInt(countResult.rows[0].total)

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
  const result = await query(
    `SELECT ps.*, u.username as creator_name,
        COALESCE(jsonb_array_length(ps.problem_ids), 0) as problem_count
       FROM problem_sets ps
       LEFT JOIN users u ON ps.creator_id = u.id
       ${whereClause}
       ORDER BY ps.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...params, parseInt(limit as string), offset]
  )

  // Get progress for each set
  const setsWithProgress = await Promise.all(
    result.rows.map(async (ps: any) => {
      const pids = ps.problem_ids || []
      if (pids.length === 0) {
        return { ...ps, solved_count: 0, progress: 0 }
      }
      const solved = await query(
        `SELECT COUNT(DISTINCT problem_id) as cnt FROM submissions
           WHERE user_id = $1 AND status = 'accepted' AND problem_id = ANY($2::int[])`,
        [userId, pids]
      )
      const solvedCount = parseInt(solved.rows[0].cnt)
      return {
        ...ps,
        solved_count: solvedCount,
        progress: Math.round((solvedCount / pids.length) * 100),
      }
    })
  )

  return sendSuccess(res, { problemSets: setsWithProgress, total })
})

export const getProblemSetById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const result = await query(
    `SELECT ps.*, u.username as creator_name
       FROM problem_sets ps
       LEFT JOIN users u ON ps.creator_id = u.id
       WHERE ps.id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw notFound('题单不存在')
  }

  const problemSet = result.rows[0]
  const pids: number[] = problemSet.problem_ids || []

  // Fetch problems in order
  let problems: any[] = []
  if (pids.length > 0) {
    const problemsResult = await query(
      `SELECT p.id, p.title, p.difficulty, p.category, p.problem_no
         FROM problems p WHERE p.id = ANY($1::int[])`,
      [pids]
    )
    // Preserve order from problem_ids
    const problemMap = new Map(problemsResult.rows.map((p: any) => [p.id, p]))
    problems = pids.map((pid: number) => problemMap.get(pid)).filter(Boolean)
  }

  // Get user's solved problems
  let solvedProblemIds: number[] = []
  if (userId && pids.length > 0) {
    const solvedResult = await query(
      `SELECT DISTINCT problem_id FROM submissions
         WHERE user_id = $1 AND status = 'accepted' AND problem_id = ANY($2::int[])`,
      [userId, pids]
    )
    solvedProblemIds = solvedResult.rows.map((r: any) => r.problem_id)
  }

  const totalCount = pids.length
  const solvedCount = solvedProblemIds.length

  return sendSuccess(res, {
    problemSet,
    problems,
    solvedProblemIds,
    progress: {
      solved_count: solvedCount,
      total_count: totalCount,
      percentage: totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0,
    },
  })
})

export const createProblemSet = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { title, description, difficulty, cover_color, problem_ids, is_published } = req.body
  const category = req.body.category || '未分类'

  const result = await query(
    `INSERT INTO problem_sets (title, description, category, difficulty, cover_color, problem_ids, creator_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, description || null, category, difficulty || 'mixed',
     cover_color || '#1890ff', JSON.stringify(problem_ids || []),
     userId, is_published || false]
  )

  return sendSuccess(res, { problemSet: result.rows[0] }, 201)
})

export const updateProblemSet = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description, category, difficulty, cover_color, problem_ids, is_published } = req.body

  const result = await query(
    `UPDATE problem_sets SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       category = COALESCE($3, category),
       difficulty = COALESCE($4, difficulty),
       cover_color = COALESCE($5, cover_color),
       problem_ids = COALESCE($6, problem_ids),
       is_published = COALESCE($7, is_published),
       updated_at = NOW()
       WHERE id = $8 RETURNING *`,
    [title || null, description !== undefined ? description : null,
     category || null, difficulty || null, cover_color || null,
     problem_ids ? JSON.stringify(problem_ids) : null,
     is_published !== undefined ? is_published : null, id]
  )

  if (result.rows.length === 0) {
    throw notFound('题单不存在')
  }

  return sendSuccess(res, { problemSet: result.rows[0] })
})

export const deleteProblemSet = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query('DELETE FROM problem_sets WHERE id = $1 RETURNING id', [id])

  if (result.rows.length === 0) {
    throw notFound('题单不存在')
  }

  return sendSuccess(res, { message: '已删除' })
})

export const publishProblemSet = asyncHandler(async (req, res) => {
  const { id } = req.params

  const result = await query(
    `UPDATE problem_sets SET is_published = true, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  )

  if (result.rows.length === 0) {
    throw notFound('题单不存在')
  }

  return sendSuccess(res, { problemSet: result.rows[0] })
})

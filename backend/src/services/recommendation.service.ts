import { query } from '../config/database'

export async function getNextProblem(userId: number): Promise<{ problem: any; reason: string; skill_gap?: string } | null> {
  // Check enrolled paths first
  const enrolledPaths = await query(
    `SELECT lp.id, lp.title FROM user_path_enrollments upe
     JOIN learning_paths lp ON upe.path_id = lp.id
     WHERE upe.user_id = $1 AND upe.completed_at IS NULL
     ORDER BY upe.enrolled_at DESC LIMIT 3`, [userId]
  )

  if (enrolledPaths.rows.length > 0) {
    for (const path of enrolledPaths.rows) {
      const nextProblem = await findNextInPath(userId, path.id)
      if (nextProblem) return { problem: nextProblem, reason: `学习路径「${path.title}」中的下一题`, skill_gap: undefined }
    }
  }

  // Find weakest skill category
  const skills = await query(
    `SELECT category, solved_count, attempt_count FROM user_skills WHERE user_id = $1`, [userId]
  )

  if (skills.rows.length === 0) {
    const easyProblem = await query(
      `SELECT id, title, difficulty, category FROM problems WHERE difficulty = 'easy' AND problem_type = 'coding'
       ORDER BY RANDOM() LIMIT 1`
    )
    return easyProblem.rows[0] ? { problem: easyProblem.rows[0], reason: '推荐从简单题开始' } : null
  }

  const weakest = skills.rows.reduce((min: any, s: any) => {
    const rate = s.attempt_count > 0 ? s.solved_count / s.attempt_count : 0
    return rate < (min.rate) ? { category: s.category, rate } : min
  }, { category: '', rate: Infinity })

  const solvedIds = await query(
    `SELECT DISTINCT problem_id FROM submissions WHERE user_id = $1 AND status = 'accepted'`, [userId]
  )
  const solvedSet = new Set(solvedIds.rows.map((r: any) => r.problem_id))

  const candidates = await query(
    `SELECT id, title, difficulty, category FROM problems
     WHERE category = $1 AND difficulty IN ('easy', 'medium') AND problem_type = 'coding'
     ORDER BY difficulty ASC, RANDOM() LIMIT 10`, [weakest.category]
  )

  const unsolved = candidates.rows.find((p: any) => !solvedSet.has(p.id))
  if (unsolved) {
    return { problem: unsolved, reason: `加强薄弱技能「${weakest.category}」`, skill_gap: weakest.category }
  }

  const fallback = await query(
    `SELECT id, title, difficulty, category FROM problems WHERE problem_type = 'coding'
     ORDER BY RANDOM() LIMIT 1`
  )
  return fallback.rows[0] ? { problem: fallback.rows[0], reason: '随机推荐' } : null
}

async function findNextInPath(userId: number, pathId: number): Promise<any | null> {
  const stages = await query(
    `SELECT id, order_index, title FROM learning_path_stages WHERE path_id = $1 ORDER BY order_index`, [pathId]
  )

  const solvedRes = await query(
    `SELECT DISTINCT problem_id FROM submissions WHERE user_id = $1 AND status = 'accepted'`, [userId]
  )
  const solvedSet = new Set(solvedRes.rows.map((r: any) => r.problem_id))

  for (const stage of stages.rows) {
    const problems = await query(
      `SELECT lpp.problem_id, lpp.is_required, p.title, p.difficulty, p.category
       FROM learning_path_problems lpp JOIN problems p ON lpp.problem_id = p.id
       WHERE lpp.stage_id = $1 ORDER BY lpp.order_index`, [stage.id]
    )

    const unsolvedRequired = problems.rows.find((p: any) => p.is_required && !solvedSet.has(p.problem_id))
    if (unsolvedRequired) return unsolvedRequired
  }

  return null
}

export async function recommendPath(userId: number): Promise<{ path: any; reason: string } | null> {
  const skills = await query(
    `SELECT category, solved_count FROM user_skills WHERE user_id = $1`, [userId]
  )

  const enrolled = await query(
    `SELECT path_id FROM user_path_enrollments WHERE user_id = $1 AND completed_at IS NULL`, [userId]
  )
  const enrolledSet = new Set(enrolled.rows.map((r: any) => r.path_id))

  let targetCategory: string | null = null
  if (skills.rows.length > 0) {
    const weakest = skills.rows.reduce((min: any, s: any) =>
      s.solved_count < min.solved_count ? s : min, skills.rows[0])
    targetCategory = weakest.category
  }

  let pathQuery = targetCategory
    ? `SELECT * FROM learning_paths WHERE is_published = TRUE AND category = $1 ORDER BY RANDOM() LIMIT 1`
    : `SELECT * FROM learning_paths WHERE is_published = TRUE ORDER BY RANDOM() LIMIT 1`
  let pathParams = targetCategory ? [targetCategory] : []

  const result = await query(pathQuery, pathParams)
  const path = result.rows.find((p: any) => !enrolledSet.has(p.id))

  if (path) {
    return { path, reason: targetCategory ? `加强「${targetCategory}」技能` : '推荐的学习路径' }
  }
  return null
}

import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

export const getContests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    let queryText = 'SELECT * FROM contests WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (status) {
      const now = new Date()
      if (status === 'upcoming') {
        queryText += ` AND start_time > $${paramCount++}`
        params.push(now)
      } else if (status === 'ongoing') {
        queryText += ` AND start_time <= $${paramCount++} AND end_time >= $${paramCount++}`
        params.push(now, now)
      } else if (status === 'past') {
        queryText += ` AND end_time < $${paramCount++}`
        params.push(now)
      }
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    queryText += ` ORDER BY start_time DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(parseInt(limit as string), offset)

    const result = await query(queryText, params)

    res.json({
      success: true,
      data: { contests: result.rows }
    })
  } catch (error) {
    next(error)
  }
}

export const getContestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('SELECT * FROM contests WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '比赛不存在' }
      })
    }

    const problemsResult = await query(
      'SELECT problem_id FROM contest_problems WHERE contest_id = $1 ORDER BY order_index',
      [id]
    )

    res.json({
      success: true,
      data: {
        contest: result.rows[0],
        problem_ids: problemsResult.rows.map((row: { problem_id: number }) => row.problem_id)
      }
    })
  } catch (error) {
    next(error)
  }
}

export const createContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, start_time, end_time, creator_id, problem_ids } = req.body

    const result = await query(
      `INSERT INTO contests (title, description, start_time, end_time, creator_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, start_time, end_time, creator_id]
    )

    const contestId = result.rows[0].id

    if (problem_ids && problem_ids.length > 0) {
      for (let i = 0; i < problem_ids.length; i++) {
        await query(
          `INSERT INTO contest_problems (contest_id, problem_id, order_index)
           VALUES ($1, $2, $3)`,
          [contestId, problem_ids[i], i]
        )
      }
    }

    res.status(201).json({
      success: true,
      data: { contest: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const updateContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { title, description, start_time, end_time } = req.body

    const result = await query(
      `UPDATE contests
       SET title = $1, description = $2, start_time = $3, end_time = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, start_time, end_time, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '比赛不存在' }
      })
    }

    res.json({
      success: true,
      data: { contest: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
}

export const deleteContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const result = await query('DELETE FROM contests WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '比赛不存在' }
      })
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    next(error)
  }
}

export const registerForContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { user_id } = req.body

    const existing = await query(
      'SELECT * FROM contest_registrations WHERE contest_id = $1 AND user_id = $2',
      [id, user_id]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: '已经注册过该比赛' }
      })
    }

    await query(
      `INSERT INTO contest_registrations (contest_id, user_id)
       VALUES ($1, $2)`,
      [id, user_id]
    )

    res.json({
      success: true,
      message: '注册成功'
    })
  } catch (error) {
    next(error)
  }
}

export const getContestStandings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const contestResult = await query('SELECT * FROM contests WHERE id = $1', [id])
    if (contestResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '比赛不存在' } })
    }

    const problemsResult = await query(
      'SELECT problem_id FROM contest_problems WHERE contest_id = $1 ORDER BY order_index',
      [id]
    )
    const problemIds = problemsResult.rows.map((r: { problem_id: number }) => r.problem_id)

    const registrantsResult = await query(
      `SELECT u.id, u.username, u.avatar FROM contest_registrations cr
       JOIN users u ON u.id = cr.user_id WHERE cr.contest_id = $1`,
      [id]
    )

    if (registrantsResult.rows.length === 0) {
      return res.json({ success: true, data: { standings: [], problems: problemIds } })
    }

    const userIds = registrantsResult.rows.map((r: any) => r.id)

    const submissionsResult = await query(
      `SELECT s.user_id, s.problem_id, s.status, s.created_at
       FROM submissions s
       WHERE s.problem_id = ANY($1) AND s.user_id = ANY($2)`,
      [problemIds, userIds]
    )

    const userMap = new Map<number, { username: string; avatar: string | null }>()
    for (const r of registrantsResult.rows) {
      userMap.set(r.id, { username: r.username, avatar: r.avatar })
    }

    type ProblemStat = { solved: boolean; attempts: number; time: number | null }
    const standingsMap = new Map<number, Map<number, ProblemStat>>()

    for (const sub of submissionsResult.rows) {
      if (!standingsMap.has(sub.user_id)) {
        standingsMap.set(sub.user_id, new Map())
      }
      const userProblems = standingsMap.get(sub.user_id)!
      if (!userProblems.has(sub.problem_id)) {
        userProblems.set(sub.problem_id, { solved: false, attempts: 0, time: null })
      }
      const stat = userProblems.get(sub.problem_id)!
      stat.attempts++
      if (!stat.solved && sub.status === 'accepted') {
        stat.solved = true
        const startTime = new Date(contestResult.rows[0].start_time).getTime()
        const subTime = new Date(sub.created_at).getTime()
        stat.time = Math.max(0, Math.round((subTime - startTime) / 1000))
      }
    }

    const standings = Array.from(userMap.entries()).map(([userId, info]) => {
      const userProblems = standingsMap.get(userId) || new Map<number, ProblemStat>()
      let totalSolved = 0
      let totalTime = 0
      const problems: Record<number, { solved: boolean; attempts: number; time: number | null }> = {}

      for (const pid of problemIds) {
        const stat = userProblems.get(pid) || { solved: false, attempts: 0, time: null }
        problems[pid] = stat
        if (stat.solved) {
          totalSolved++
          totalTime += (stat.time || 0) + (stat.attempts - 1) * 20 * 60
        }
      }

      return { user_id: userId, username: info.username, avatar: info.avatar, solved: totalSolved, time: totalTime, problems }
    })

    standings.sort((a, b) => b.solved - a.solved || a.time - b.time)

    res.json({ success: true, data: { standings, problems: problemIds } })
  } catch (error) {
    next(error)
  }
}
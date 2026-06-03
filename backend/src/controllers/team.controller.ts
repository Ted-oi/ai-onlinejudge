import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { generateInviteCode, aggregateTeamStats } from '../services/team.service'

export const getTeams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { team_type, search, page = 1, limit = 20 } = req.query
    const conditions = ['is_public = TRUE']
    const params: any[] = []
    let pc = 1

    if (team_type) { conditions.push(`team_type = $${pc++}`); params.push(team_type) }
    if (search) { conditions.push(`name ILIKE $${pc++}`); params.push(`%${search}%`) }

    const where = 'WHERE ' + conditions.join(' AND ')
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const countRes = await query(`SELECT COUNT(*) as total FROM teams ${where}`, params)
    const result = await query(
      `SELECT t.*, u.username as leader_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
       FROM teams t JOIN users u ON t.leader_id = u.id
       ${where} ORDER BY t.created_at DESC LIMIT $${pc++} OFFSET $${pc++}`,
      [...params, parseInt(limit as string), offset]
    )

    res.json({ success: true, data: { teams: result.rows, total: parseInt(countRes.rows[0].total) } })
  } catch (error) { next(error) }
}

export const getMyTeams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const result = await query(
      `SELECT t.*, tm.role as my_role, u.username as leader_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
       FROM team_members tm JOIN teams t ON tm.team_id = t.id
       JOIN users u ON t.leader_id = u.id
       WHERE tm.user_id = $1 ORDER BY tm.joined_at DESC`, [userId]
    )
    res.json({ success: true, data: { teams: result.rows } })
  } catch (error) { next(error) }
}

export const getTeamById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await query(
      `SELECT t.*, u.username as leader_name FROM teams t JOIN users u ON t.leader_id = u.id WHERE t.id = $1`, [id]
    )
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: '团队不存在' } })

    const team = result.rows[0]

    // Check membership
    const memberRes = await query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [id, userId]
    )
    team.my_role = memberRes.rows[0]?.role || null

    const memberCount = await query('SELECT COUNT(*) as cnt FROM team_members WHERE team_id = $1', [id])
    team.member_count = parseInt(memberCount.rows[0].cnt)

    res.json({ success: true, data: { team } })
  } catch (error) { next(error) }
}

export const createTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const userRole = req.userRole
    const { name, description, team_type, max_members, is_public } = req.body

    if (!name) return res.status(400).json({ success: false, error: { message: '团队名称为必填' } })
    if (team_type === 'class' && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ success: false, error: { message: '仅教师/管理员可创建班级' } })
    }

    const code = generateInviteCode()
    const result = await query(
      `INSERT INTO teams (name, description, team_type, leader_id, invite_code, max_members, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description || null, team_type || 'team', userId, code, max_members || 50, is_public !== false]
    )

    // Creator becomes leader
    await query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'leader')`,
      [result.rows[0].id, userId]
    )

    res.status(201).json({ success: true, data: { team: result.rows[0] } })
  } catch (error) { next(error) }
}

export const updateTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId
    const userRole = req.userRole
    const { name, description, max_members, is_public } = req.body

    const team = await query('SELECT leader_id FROM teams WHERE id = $1', [id])
    if (team.rows.length === 0) return res.status(404).json({ success: false, error: { message: '团队不存在' } })
    if (team.rows[0].leader_id !== userId && userRole !== 'admin') return res.status(403).json({ success: false, error: { message: '权限不足' } })

    const result = await query(
      `UPDATE teams SET name = COALESCE($1, name), description = COALESCE($2, description),
       max_members = COALESCE($3, max_members), is_public = COALESCE($4, is_public),
       updated_at = NOW() WHERE id = $5 RETURNING *`,
      [name || null, description || null, max_members || null, is_public !== undefined ? is_public : null, id]
    )

    res.json({ success: true, data: { team: result.rows[0] } })
  } catch (error) { next(error) }
}

export const deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId
    const userRole = req.userRole

    const team = await query('SELECT leader_id FROM teams WHERE id = $1', [id])
    if (team.rows.length === 0) return res.status(404).json({ success: false, error: { message: '团队不存在' } })
    if (team.rows[0].leader_id !== userId && userRole !== 'admin') return res.status(403).json({ success: false, error: { message: '权限不足' } })

    await query('DELETE FROM teams WHERE id = $1', [id])
    res.json({ success: true, data: { message: '已删除' } })
  } catch (error) { next(error) }
}

export const joinTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId
    const { invite_code } = req.body

    const team = await query('SELECT invite_code, max_members, is_public FROM teams WHERE id = $1', [id])
    if (team.rows.length === 0) return res.status(404).json({ success: false, error: { message: '团队不存在' } })

    const t = team.rows[0]
    if (!t.is_public && t.invite_code !== invite_code) {
      return res.status(403).json({ success: false, error: { message: '邀请码错误' } })
    }

    const existing = await query('SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2', [id, userId])
    if (existing.rows.length > 0) return res.status(409).json({ success: false, error: { message: '已加入' } })

    const memberCount = await query('SELECT COUNT(*) as cnt FROM team_members WHERE team_id = $1', [id])
    if (parseInt(memberCount.rows[0].cnt) >= t.max_members) {
      return res.status(409).json({ success: false, error: { message: '团队已满' } })
    }

    await query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)', [id, userId, 'member'])
    res.json({ success: true, data: { message: '已加入团队' } })
  } catch (error) { next(error) }
}

export const leaveTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const member = await query('SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [id, userId])
    if (member.rows.length === 0) return res.status(404).json({ success: false, error: { message: '未加入此团队' } })
    if (member.rows[0].role === 'leader') return res.status(400).json({ success: false, error: { message: '队长需先转让队长身份' } })

    await query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [id, userId])
    res.json({ success: true, data: { message: '已退出团队' } })
  } catch (error) { next(error) }
}

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId: targetUserId } = req.params
    const currentUserId = req.userId
    const userRole = req.userRole

    const team = await query('SELECT leader_id FROM teams WHERE id = $1', [id])
    if (team.rows.length === 0) return res.status(404).json({ success: false, error: { message: '团队不存在' } })
    if (team.rows[0].leader_id !== currentUserId && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    await query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [id, targetUserId])
    res.json({ success: true, data: { message: '已移除' } })
  } catch (error) { next(error) }
}

export const transferLeadership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { new_leader_id } = req.body
    const userId = req.userId

    const team = await query('SELECT leader_id FROM teams WHERE id = $1', [id])
    if (team.rows.length === 0) return res.status(404).json({ success: false, error: { message: '团队不存在' } })
    if (team.rows[0].leader_id !== userId) return res.status(403).json({ success: false, error: { message: '仅队长可转让' } })

    const target = await query('SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2', [id, new_leader_id])
    if (target.rows.length === 0) return res.status(404).json({ success: false, error: { message: '目标用户不是成员' } })

    await query('UPDATE teams SET leader_id = $1 WHERE id = $2', [new_leader_id, id])
    await query('UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3', ['leader', id, new_leader_id])
    await query('UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3', ['member', id, userId])

    res.json({ success: true, data: { message: '已转让' } })
  } catch (error) { next(error) }
}

export const generateInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const team = await query('SELECT leader_id FROM teams WHERE id = $1', [id])
    if (team.rows.length === 0) return res.status(404).json({ success: false, error: { message: '团队不存在' } })

    const member = await query('SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [id, userId])
    if (member.rows.length === 0 || (member.rows[0].role !== 'leader' && member.rows[0].role !== 'co_leader')) {
      return res.status(403).json({ success: false, error: { message: '权限不足' } })
    }

    const code = generateInviteCode()
    await query('UPDATE teams SET invite_code = $1 WHERE id = $2', [code, id])
    res.json({ success: true, data: { invite_code: code } })
  } catch (error) { next(error) }
}

export const getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT tm.role, tm.joined_at, u.id, u.username, u.avatar, u.rating, u.solved_count
       FROM team_members tm JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1 ORDER BY
       CASE tm.role WHEN 'leader' THEN 1 WHEN 'co_leader' THEN 2 ELSE 3 END, u.rating DESC`,
      [id]
    )
    res.json({ success: true, data: { members: result.rows } })
  } catch (error) { next(error) }
}

export const getTeamStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const stats = await aggregateTeamStats(Number(id))
    res.json({ success: true, data: stats })
  } catch (error) { next(error) }
}

export const getTeamLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT u.id, u.username, u.avatar, u.rating, u.solved_count, tm.role
       FROM team_members tm JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1 ORDER BY u.solved_count DESC, u.rating DESC`,
      [id]
    )
    res.json({ success: true, data: { leaderboard: result.rows } })
  } catch (error) { next(error) }
}

export const getGlobalTeamLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { team_type, page = 1, limit = 20 } = req.query

    let where = '1=1'
    const params: any[] = []
    let pc = 1
    if (team_type) { where += ` AND team_type = $${pc++}`; params.push(team_type) }

    const teams = await query(
      `SELECT t.id, t.name, t.avatar, t.team_type,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
       FROM teams t WHERE ${where} ORDER BY t.created_at DESC`, params
    )

    const leaderboard = await Promise.all(teams.rows.map(async (t: any) => {
      const stats = await aggregateTeamStats(t.id)
      return { ...t, ...stats }
    }))

    leaderboard.sort((a, b) => b.total_solved - a.total_solved)

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
    const paged = leaderboard.slice(offset, offset + parseInt(limit as string))

    res.json({ success: true, data: { leaderboard: paged, total: leaderboard.length } })
  } catch (error) { next(error) }
}

export const joinByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const { invite_code } = req.body

    if (!invite_code) return res.status(400).json({ success: false, error: { message: '请输入邀请码' } })

    const team = await query('SELECT id, max_members FROM teams WHERE invite_code = $1', [invite_code])
    if (team.rows.length === 0) return res.status(404).json({ success: false, error: { message: '邀请码无效' } })

    const t = team.rows[0]
    const existing = await query('SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2', [t.id, userId])
    if (existing.rows.length > 0) return res.status(409).json({ success: false, error: { message: '已加入' } })

    const memberCount = await query('SELECT COUNT(*) as cnt FROM team_members WHERE team_id = $1', [t.id])
    if (parseInt(memberCount.rows[0].cnt) >= t.max_members) {
      return res.status(409).json({ success: false, error: { message: '团队已满' } })
    }

    await query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)', [t.id, userId, 'member'])
    res.json({ success: true, data: { message: '已加入团队', team_id: t.id } })
  } catch (error) { next(error) }
}

import { query } from '../config/database'

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function aggregateTeamStats(teamId: number) {
  const members = await query('SELECT user_id FROM team_members WHERE team_id = $1', [teamId])
  if (members.rows.length === 0) return { total_solved: 0, total_submissions: 0, category_breakdown: {}, active_members: 0 }

  const userIds = members.rows.map((r: any) => r.user_id)

  const statsRes = await query(
    `SELECT SUM(solved_count) as total_solved, SUM(submit_count) as total_submissions FROM users WHERE id = ANY($1)`,
    [userIds]
  )

  const categoryRes = await query(
    `SELECT category, SUM(solved_count) as solved FROM user_skills WHERE user_id = ANY($1) GROUP BY category`,
    [userIds]
  )

  const activeRes = await query(
    `SELECT COUNT(DISTINCT user_id) as cnt FROM user_daily_activity
     WHERE user_id = ANY($1) AND activity_date >= CURRENT_DATE - INTERVAL '7 days'`,
    [userIds]
  )

  return {
    total_solved: parseInt(statsRes.rows[0]?.total_solved || '0'),
    total_submissions: parseInt(statsRes.rows[0]?.total_submissions || '0'),
    category_breakdown: Object.fromEntries(categoryRes.rows.map((r: any) => [r.category, parseInt(r.solved)])),
    active_members: parseInt(activeRes.rows[0]?.cnt || '0'),
    member_count: members.rows.length,
  }
}

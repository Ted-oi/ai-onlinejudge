import { query } from '../config/database'

interface BadgeDefinition {
  badge_type: string
  badge_name: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
}

interface UserStats {
  solved_count: number
  submit_count: number
  category_count: number
  streak_days: number
  contest_wins: number
  contest_top3: number
}

const BADGES: BadgeDefinition[] = [
  { badge_type: 'first_solve', badge_name: '初出茅庐', description: '首次解决一道题目', icon: 'rocket', condition: s => s.solved_count >= 1 },
  { badge_type: 'problem_solver_10', badge_name: '小有成就', description: '累计解决 10 道题目', icon: 'star', condition: s => s.solved_count >= 10 },
  { badge_type: 'problem_solver_50', badge_name: '解题达人', description: '累计解决 50 道题目', icon: 'fire', condition: s => s.solved_count >= 50 },
  { badge_type: 'centurion', badge_name: '百题斩', description: '累计解决 100 道题目', icon: 'crown', condition: s => s.solved_count >= 100 },
  { badge_type: 'streak_7', badge_name: '坚持不懈', description: '连续 7 天活跃', icon: 'thunderbolt', condition: s => s.streak_days >= 7 },
  { badge_type: 'streak_30', badge_name: '月度之星', description: '连续 30 天活跃', icon: 'diamond', condition: s => s.streak_days >= 30 },
  { badge_type: 'contest_winner', badge_name: '竞赛冠军', description: '在竞赛中获得第一名', icon: 'trophy', condition: s => s.contest_wins >= 1 },
  { badge_type: 'contest_top3', badge_name: '领奖台', description: '在竞赛中获得前三名', icon: 'medal', condition: s => s.contest_top3 >= 1 },
  { badge_type: 'code_master', badge_name: '代码大师', description: '提交超过 100 次且通过率 > 80%', icon: 'code', condition: s => s.submit_count >= 100 && (s.solved_count / s.submit_count) > 0.8 },
  { badge_type: 'explorer', badge_name: '知识探索者', description: '在 5 个不同类别中解题', icon: 'compass', condition: s => s.category_count >= 5 },
]

export async function checkAndAwardBadges(userId: number): Promise<string[]> {
  const userRes = await query('SELECT solved_count, submit_count FROM users WHERE id = $1', [userId])
  if (userRes.rows.length === 0) return []

  const user = userRes.rows[0]

  const categoryRes = await query(
    `SELECT COUNT(DISTINCT category) as cnt FROM user_skills WHERE user_id = $1 AND solved_count > 0`,
    [userId]
  )
  const category_count = parseInt(categoryRes.rows[0]?.cnt || '0')

  const streakRes = await query(
    `SELECT COUNT(*) as cnt FROM user_daily_activity
     WHERE user_id = $1 AND activity_date >= CURRENT_DATE - INTERVAL '30 days'
     AND solved_count > 0`,
    [userId]
  )
  const streak_days = parseInt(streakRes.rows[0]?.cnt || '0')

  const contestWinRes = await query(
    `SELECT COUNT(*) as wins FROM contest_participants cp
     JOIN contests c ON cp.contest_id = c.id
     WHERE cp.user_id = $1 AND cp.rank = 1`,
    [userId]
  )
  const contest_wins = parseInt(contestWinRes.rows[0]?.wins || '0')

  const contestTop3Res = await query(
    `SELECT COUNT(*) as tops FROM contest_participants cp
     JOIN contests c ON cp.contest_id = c.id
     WHERE cp.user_id = $1 AND cp.rank <= 3`,
    [userId]
  )
  const contest_top3 = parseInt(contestTop3Res.rows[0]?.tops || '0')

  const stats: UserStats = {
    solved_count: user.solved_count,
    submit_count: user.submit_count,
    category_count,
    streak_days,
    contest_wins,
    contest_top3,
  }

  const earnedTypes = new Set(
    (await query('SELECT badge_type FROM user_achievements WHERE user_id = $1', [userId]))
      .rows.map((r: any) => r.badge_type)
  )

  const newBadges: string[] = []
  for (const badge of BADGES) {
    if (!earnedTypes.has(badge.badge_type) && badge.condition(stats)) {
      await query(
        `INSERT INTO user_achievements (user_id, badge_type, badge_name, description, icon)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [userId, badge.badge_type, badge.badge_name, badge.description, badge.icon]
      )
      newBadges.push(badge.badge_name)
    }
  }

  return newBadges
}

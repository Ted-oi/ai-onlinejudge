import { query } from '../config/database'

export const awardPoints = async (userId: number, points: number): Promise<void> => {
  if (!points) return
  await query(
    `INSERT INTO user_points (user_id, points, total_earned)
     VALUES ($1, $2, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET
       points = user_points.points + $2,
       total_earned = user_points.total_earned + $2,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, points]
  )
}

export const spendPoints = async (userId: number, points: number): Promise<boolean> => {
  const res = await query(
    `UPDATE user_points
       SET points = points - $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND points >= $2
       RETURNING user_id`,
    [userId, points]
  )
  return res.rows.length > 0
}

export const getPoints = async (userId: number): Promise<number> => {
  const res = await query(
    'SELECT points FROM user_points WHERE user_id = $1',
    [userId]
  )
  return res.rows.length > 0 ? res.rows[0].points : 0
}

export const getLeaderboard = async (limit = 50) => {
  const res = await query(
    `SELECT up.user_id, up.points, up.total_earned, u.username, u.avatar, u.rating
       FROM user_points up
       JOIN users u ON u.id = up.user_id
       ORDER BY up.points DESC, up.total_earned DESC
       LIMIT $1`,
    [limit]
  )
  return res.rows
}

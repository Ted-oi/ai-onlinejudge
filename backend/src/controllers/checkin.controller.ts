import { query } from '../config/database'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendSuccessWithMessage } from '../utils/apiResponse'
import { badRequest, conflict } from '../utils/apiError'
import { createNotification } from './notification.controller'
import { awardPoints } from '../services/points.service'

const DAY_BONUS_CAP = 7 // 连续签到积分上限：第 7 天起每天 7 分

function calcCheckinPoints(consecutive: number): number {
  return Math.min(consecutive, DAY_BONUS_CAP)
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthStr(): string {
  return new Date().toISOString().slice(0, 7)
}

function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000
  const da = new Date(a.toISOString().slice(0, 10) + 'T00:00:00Z').getTime()
  const db = new Date(b.toISOString().slice(0, 10) + 'T00:00:00Z').getTime()
  return Math.round((db - da) / ms)
}

export const checkinToday = asyncHandler(async (req, res) => {
  const userId = req.userId
  const today = todayStr()

  // 幂等：当日已签到
  const existing = await query(
    'SELECT id FROM user_checkins WHERE user_id = $1 AND checkin_date = $2',
    [userId, today]
  )
  if (existing.rows.length > 0) {
    throw conflict('今天已经签到过了')
  }

  // 查昨日记录以计算连续天数
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().slice(0, 10)

  const prev = await query(
    'SELECT consecutive_days FROM user_checkins WHERE user_id = $1 AND checkin_date = $2',
    [userId, yStr]
  )

  const consecutive = prev.rows.length > 0 ? prev.rows[0].consecutive_days + 1 : 1
  const points = calcCheckinPoints(consecutive)

  await query(
    `INSERT INTO user_checkins (user_id, checkin_date, consecutive_days, points_earned)
     VALUES ($1, $2, $3, $4)`,
    [userId, today, consecutive, points]
  )

  await awardPoints(userId, points)

  // 检查月度全勤
  const monthRewards = await checkAndAwardMonthly(userId)
  const todayRecord = (await query(
    `SELECT checkin_date, consecutive_days, points_earned, created_at
       FROM user_checkins WHERE user_id = $1 AND checkin_date = $2`,
    [userId, today]
  )).rows[0]

  return sendSuccessWithMessage(res,
    `签到成功，连续 ${consecutive} 天，获得 ${points} 积分`,
    { ...todayRecord, monthBonus: monthRewards }
  )
})

async function checkAndAwardMonthly(userId: number) {
  const ym = monthStr()
  const [monthCount, alreadyAwarded] = await Promise.all([
    query(
      `SELECT COUNT(*)::int as cnt, MAX(consecutive_days) as max_streak
         FROM user_checkins
         WHERE user_id = $1 AND to_char(checkin_date, 'YYYY-MM') = $2`,
      [userId, ym]
    ),
    query(
      'SELECT id FROM checkin_monthly_rewards WHERE user_id = $1 AND year_month = $2',
      [userId, ym]
    ),
  ])

  const cnt = monthCount.rows[0].cnt
  const maxStreak = monthCount.rows[0].max_streak || 0
  if (cnt < 28 || alreadyAwarded.rows.length > 0) return null

  // 当月 28+ 天视为全勤：按 maxStreak 给予阶梯奖励
  let bonus = 50
  if (maxStreak >= 30) bonus = 100
  else if (maxStreak >= 28) bonus = 80

  await query(
    `INSERT INTO checkin_monthly_rewards (user_id, year_month, consecutive_days, bonus_points)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, year_month) DO NOTHING`,
    [userId, ym, maxStreak, bonus]
  )
  await awardPoints(userId, bonus)
  await createNotification(
    userId,
    'checkin_bonus',
    '月度全勤奖励',
    `本月全勤 ${maxStreak} 天，获得 ${bonus} 积分奖励！`,
    '/checkin'
  )
  return { bonus, maxStreak }
}

export const getTodayStatus = asyncHandler(async (req, res) => {
  const userId = req.userId
  const today = todayStr()

  const todayRow = (await query(
    'SELECT id, checkin_date, consecutive_days, points_earned FROM user_checkins WHERE user_id = $1 AND checkin_date = $2',
    [userId, today]
  )).rows[0]

  // 当前连续天数：基于今天或昨天
  const lastRow = (await query(
    `SELECT checkin_date, consecutive_days FROM user_checkins
      WHERE user_id = $1
      ORDER BY checkin_date DESC LIMIT 1`,
    [userId]
  )).rows[0]

  let currentStreak = 0
  if (lastRow) {
    const last = new Date(lastRow.checkin_date)
    const t = new Date(today + 'T00:00:00Z')
    const diff = daysBetween(last, t)
    if (diff === 0) currentStreak = lastRow.consecutive_days
    else if (diff === 1) currentStreak = lastRow.consecutive_days
    else currentStreak = 0
  }

  return sendSuccess(res, {
    checkedInToday: !!todayRow,
    todayRecord: todayRow || null,
    currentStreak,
  })
})

export const getHistory = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { month } = req.query

  let filter = 'user_id = $1'
  const params: any[] = [userId]
  if (month) {
    filter += ` AND to_char(checkin_date, 'YYYY-MM') = $2`
    params.push(month)
  }

  const rows = (await query(
    `SELECT checkin_date, consecutive_days, points_earned
       FROM user_checkins
       WHERE ${filter}
       ORDER BY checkin_date DESC
       LIMIT 400`,
    params
  )).rows

  const totalRes = (await query(
    `SELECT
       COUNT(*)::int as total_days,
       COALESCE(MAX(consecutive_days), 0) as max_streak,
       COALESCE(SUM(points_earned), 0) as total_points
       FROM user_checkins WHERE user_id = $1`,
    [userId]
  )).rows[0]

  return sendSuccess(res, {
    records: rows,
    summary: {
      totalDays: totalRes.total_days,
      maxStreak: totalRes.max_streak,
      totalPoints: totalRes.total_points,
    },
  })
})

export const getCalendar = asyncHandler(async (req, res) => {
  const userId = req.userId
  const { year, month } = req.query

  if (!year || !month) throw badRequest('请提供 year 和 month 参数')

  const ym = `${year}-${String(month).padStart(2, '0')}`
  const rows = (await query(
    `SELECT to_char(checkin_date, 'YYYY-MM-DD') as date,
            consecutive_days, points_earned
       FROM user_checkins
       WHERE user_id = $1 AND to_char(checkin_date, 'YYYY-MM') = $2
       ORDER BY checkin_date`,
    [userId, ym]
  )).rows

  return sendSuccess(res, { days: rows })
})

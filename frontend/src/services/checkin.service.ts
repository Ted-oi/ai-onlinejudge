import api from './api'

export interface CheckinRecord {
  checkin_date: string
  consecutive_days: number
  points_earned: number
}

export interface CheckinStatus {
  checkedInToday: boolean
  todayRecord: CheckinRecord | null
  currentStreak: number
}

export interface CheckinHistory {
  records: CheckinRecord[]
  summary: {
    totalDays: number
    maxStreak: number
    totalPoints: number
  }
}

export interface CalendarDay {
  date: string
  consecutive_days: number
  points_earned: number
}

const checkinService = {
  getStatus: (): Promise<CheckinStatus & { monthBonus?: any }> =>
    api.get('/checkin/today').then(res => res.data.data),

  checkin: (): Promise<{ message: string; checkin_date: string; consecutive_days: number; points_earned: number; monthBonus?: any }> =>
    api.post('/checkin').then(res => res.data),

  getHistory: (month?: string): Promise<CheckinHistory> =>
    api.get('/checkin/history', { params: month ? { month } : {} }).then(res => res.data.data),

  getCalendar: (year: number, month: number): Promise<{ days: CalendarDay[] }> =>
    api.get('/checkin/calendar', { params: { year, month } }).then(res => res.data.data),
}

export default checkinService

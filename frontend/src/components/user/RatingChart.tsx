import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTheme } from '../common/ThemeSwitcher'
import type { RatingHistoryEntry } from '../../types'

const RatingChart = ({ history }: { history: RatingHistoryEntry[] }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const data = useMemo(() => {
    if (history.length === 0) return []
    return history.map(h => ({
      date: new Date(h.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      rating: h.rating,
      fullDate: new Date(h.created_at).toLocaleDateString('zh-CN'),
    }))
  }, [history])

  if (history.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无 Rating 记录</div>
  }

  const ratings = history.map(h => h.rating)
  const minR = Math.min(...ratings)
  const maxR = Math.max(...ratings)
  const latestRating = history[history.length - 1]?.rating ?? 0

  const getColor = (rating: number) => {
    if (rating >= 2400) return '#ff0000'
    if (rating >= 2000) return '#ff8c00'
    if (rating >= 1600) return '#aa00aa'
    if (rating >= 1200) return '#0000ff'
    return '#888888'
  }

  const gridColor = isDark ? '#333' : '#f0f0f0'
  const axisColor = isDark ? 'rgba(255,255,255,0.45)' : '#999'

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: getColor(latestRating) }}>
          {latestRating}
        </span>
        <span style={{ fontSize: 13, marginLeft: 8, color: isDark ? 'rgba(255,255,255,0.45)' : '#8c8c8c' }}>
          {latestRating >= 2400 ? 'Grandmaster' :
           latestRating >= 2000 ? 'Master' :
           latestRating >= 1600 ? 'Expert' :
           latestRating >= 1200 ? 'Specialist' : 'Newbie'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis
            domain={[Math.floor(minR / 100) * 100 - 100, Math.ceil(maxR / 100) * 100 + 100]}
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={{ stroke: gridColor }}
          />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1f1f1f' : '#fff',
              border: `1px solid ${isDark ? '#444' : '#e8e8e8'}`,
              borderRadius: 8,
              color: isDark ? '#e0e0e0' : '#333',
              fontSize: 13,
            }}
            formatter={(value: any) => [
              <span style={{ color: getColor(Number(value)), fontWeight: 700 }}>{value}</span>,
              'Rating',
            ]}
            labelFormatter={(label) => {
              const item = data.find(d => d.date === label)
              return item?.fullDate || label
            }}
          />
          {/* Rating tier reference lines */}
          {[1200, 1600, 2000, 2400].map(tier => (
            (tier > minR - 100 && tier < maxR + 100) ? (
              <ReferenceLine
                key={tier}
                y={tier}
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
                strokeDasharray="4 4"
              />
            ) : null
          ))}
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props
              return (
                <circle
                  key={`dot-${payload.rating}-${cx}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={getColor(payload.rating)}
                  stroke={isDark ? '#1f1f1f' : '#fff'}
                  strokeWidth={1.5}
                />
              )
            }}
            activeDot={{ r: 5, fill: '#4f46e5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RatingChart

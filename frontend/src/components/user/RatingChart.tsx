import { useMemo } from 'react'
import type { RatingHistoryEntry } from '../../types'

const RatingChart = ({ history }: { history: RatingHistoryEntry[] }) => {
  const { minR, maxR, points } = useMemo(() => {
    if (history.length === 0) return { minR: 1000, maxR: 2000, points: '' }
    const ratings = history.map(h => h.rating)
    const minR = Math.min(...ratings) - 50
    const maxR = Math.max(...ratings) + 50
    const w = 100 / Math.max(history.length - 1, 1)
    const points = history.map((h, i) => {
      const x = i * w
      const y = 100 - ((h.rating - minR) / (maxR - minR)) * 100
      return `${x},${y}`
    }).join(' ')
    return { minR, maxR, points }
  }, [history])

  if (history.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无 Rating 记录</div>
  }

  const getColor = (rating: number) => {
    if (rating >= 2400) return '#ff0000'
    if (rating >= 2000) return '#ff8c00'
    if (rating >= 1600) return '#aa00aa'
    if (rating >= 1200) return '#0000ff'
    return '#888888'
  }

  const latestRating = history[history.length - 1]?.rating ?? 0

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: getColor(latestRating) }}>
          {latestRating}
        </span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 120 }}>
        <polyline
          points={points}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {history.map((h, i) => {
          const x = history.length > 1 ? (i / (history.length - 1)) * 100 : 50
          const y = 100 - ((h.rating - minR) / (maxR - minR)) * 100
          return (
            <circle key={i} cx={x} cy={y} r="1.2" fill={getColor(h.rating)} />
          )
        })}
      </svg>
    </div>
  )
}

export default RatingChart

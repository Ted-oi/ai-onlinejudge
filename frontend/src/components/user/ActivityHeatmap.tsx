import { useState, useEffect } from 'react'
import { Card, Typography, Spin, Tooltip, Empty } from 'antd'
import { FireOutlined } from '@ant-design/icons'
import userService from '../../services/user.service'

const { Text } = Typography

interface ActivityHeatmapProps {
  userId: number
}

const ActivityHeatmap = ({ userId }: ActivityHeatmapProps) => {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.getActivityHeatmap(userId).then(data => {
      setActivities(data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spin style={{ display: 'block', margin: '20px auto' }} />
  if (activities.length === 0) return <Empty description="暂无活跃数据" />

  const maxCount = Math.max(...activities.map(a => a.submission_count), 1)

  const getColor = (count: number) => {
    if (count === 0) return '#ebedf0'
    const ratio = count / maxCount
    if (ratio < 0.25) return '#9be9a8'
    if (ratio < 0.5) return '#40c463'
    if (ratio < 0.75) return '#30a14e'
    return '#216e39'
  }

  const weeks: any[][] = []
  const activityMap: Record<string, any> = {}
  activities.forEach(a => {
    activityMap[a.activity_date] = a
  })

  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)
  const endDate = new Date()

  let currentWeek: any[] = []
  const d = new Date(startDate)
  while (d <= endDate) {
    const dateStr = d.toISOString().split('T')[0]
    const activity = activityMap[dateStr]
    currentWeek.push({
      date: dateStr,
      count: activity?.submission_count || 0,
      solved: activity?.solved_count || 0,
    })
    if (d.getDay() === 6) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    d.setDate(d.getDate() + 1)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return (
    <Card title={<><FireOutlined /> 提交活跃度</>} size="small">
      <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 4 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {week.map((day, di) => (
              <Tooltip key={di} title={`${day.date}: ${day.count} 次提交, ${day.solved} 次通过`}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: getColor(day.count),
                  }}
                />
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>少</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <div
            key={i}
            style={{
              width: 12, height: 12, borderRadius: 2,
              background: getColor(ratio * maxCount),
            }}
          />
        ))}
        <Text type="secondary" style={{ fontSize: 12 }}>多</Text>
      </div>
    </Card>
  )
}

export default ActivityHeatmap

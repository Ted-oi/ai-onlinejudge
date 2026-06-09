import { useState, useEffect } from 'react'
import { Card, Spin, Empty } from 'antd'
import { RadarChartOutlined } from '@ant-design/icons'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import userService from '../../services/user.service'
import { useTheme } from '../common/ThemeSwitcher'

interface SkillRadarChartProps {
  userId: number
}

const SkillRadarChart = ({ userId }: SkillRadarChartProps) => {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    userService.getSkillRadar(userId).then(data => {
      setSkills(data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spin style={{ display: 'block', margin: '20px auto' }} />
  if (skills.length === 0) return <Empty description="暂无技能数据" />

  const data = skills.map(s => ({
    category: s.category.length > 4 ? s.category.slice(0, 4) + '..' : s.category,
    fullName: s.category,
    solved: s.solved_count,
    attempted: s.attempt_count,
  }))

  const maxVal = Math.max(...data.map(d => d.attempted), 1)

  return (
    <Card title={<><RadarChartOutlined /> 技能分布</>} size="small">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke={isDark ? '#444' : '#e0e0e0'} />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: isDark ? 'rgba(255,255,255,0.65)' : '#666', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxVal]}
            tick={{ fill: isDark ? 'rgba(255,255,255,0.45)' : '#999', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="已解决"
            dataKey="solved"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.3}
          />
          <Radar
            name="已尝试"
            dataKey="attempted"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.15}
          />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1f1f1f' : '#fff',
              border: `1px solid ${isDark ? '#444' : '#e8e8e8'}`,
              borderRadius: 8,
              color: isDark ? '#e0e0e0' : '#333',
            }}
            formatter={(value: any, name: any) => [value, name]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload
              return item?.fullName || ''
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: isDark ? 'rgba(255,255,255,0.45)' : '#8c8c8c' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#4f46e5', display: 'inline-block' }} />
          已解决
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: isDark ? 'rgba(255,255,255,0.45)' : '#8c8c8c' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
          已尝试
        </span>
      </div>
    </Card>
  )
}

export default SkillRadarChart

import { useState, useEffect } from 'react'
import { Card, Typography, Spin, Empty, Tag } from 'antd'
import { RadarChartOutlined } from '@ant-design/icons'
import userService from '../../services/user.service'

const { Text } = Typography

interface SkillRadarChartProps {
  userId: number
}

const SkillRadarChart = ({ userId }: SkillRadarChartProps) => {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.getSkillRadar(userId).then(data => {
      setSkills(data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spin style={{ display: 'block', margin: '20px auto' }} />
  if (skills.length === 0) return <Empty description="暂无技能数据" />

  const maxSolved = Math.max(...skills.map(s => s.solved_count), 1)

  return (
    <Card title={<><RadarChartOutlined /> 技能分布</>} size="small">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skills.map(skill => (
          <Tag key={skill.category} color="blue" style={{ margin: 0 }}>
            {skill.category}: {skill.solved_count}/{skill.attempt_count}
          </Tag>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        {skills.map(skill => (
          <div key={skill.category} style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ width: 80, display: 'inline-block' }}>
              {skill.category}
            </Text>
            <div style={{
              display: 'inline-block',
              width: 120,
              height: 8,
              background: '#f0f0f0',
              borderRadius: 4,
              overflow: 'hidden',
              verticalAlign: 'middle',
            }}>
              <div style={{
                width: `${(skill.solved_count / maxSolved) * 100}%`,
                height: '100%',
                background: '#1890ff',
                borderRadius: 4,
              }} />
            </div>
            <Text style={{ marginLeft: 8 }}>{skill.solved_count}</Text>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default SkillRadarChart

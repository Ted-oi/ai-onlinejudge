import { Row, Col, Tooltip, Empty } from 'antd'
import {
  TrophyOutlined, RocketOutlined, StarOutlined, FireOutlined,
  CrownOutlined, ThunderboltOutlined,
  SafetyCertificateOutlined, CodeOutlined, CompassOutlined,
} from '@ant-design/icons'
import type { UserAchievement } from '../../types'

const iconMap: Record<string, React.ReactNode> = {
  trophy: <TrophyOutlined />,
  rocket: <RocketOutlined />,
  star: <StarOutlined />,
  fire: <FireOutlined />,
  crown: <CrownOutlined />,
  thunderbolt: <ThunderboltOutlined />,
  diamond: <SafetyCertificateOutlined />,
  medal: <SafetyCertificateOutlined />,
  code: <CodeOutlined />,
  compass: <CompassOutlined />,
}

const colorMap: Record<string, string> = {
  first_solve: '#52c41a',
  problem_solver_10: '#1890ff',
  problem_solver_50: '#722ed1',
  centurion: '#faad14',
  streak_7: '#eb2f96',
  streak_30: '#f5222d',
  contest_winner: '#fa8c16',
  contest_top3: '#13c2c2',
  code_master: '#2f54eb',
  explorer: '#52c41a',
}

const AchievementBadgeGrid = ({ achievements }: { achievements: UserAchievement[] }) => {
  if (achievements.length === 0) {
    return <Empty description="暂无成就" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <Row gutter={[12, 12]}>
      {achievements.map(a => (
        <Col key={a.badge_type}>
          <Tooltip title={`${a.badge_name}：${a.description}`}>
            <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: `${colorMap[a.badge_type] || '#4f46e5'}15`,
              border: `2px solid ${colorMap[a.badge_type] || '#4f46e5'}40`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 24, color: colorMap[a.badge_type] || '#4f46e5' }}>
                {iconMap[a.icon] || <TrophyOutlined />}
              </span>
            </div>
          </Tooltip>
        </Col>
      ))}
    </Row>
  )
}

export default AchievementBadgeGrid

import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Typography, Space, Progress } from 'antd'
import {
  CodeOutlined,
  TrophyOutlined,
  BookOutlined,
  RobotOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  ReadOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/admin.service'
import { useTheme } from '../../components/common/ThemeSwitcher'

const { Title, Paragraph, Text } = Typography

const Home = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const data = await adminService.getPublicStats()
      setStats(data)
    } catch {} finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: '题库', value: stats?.totalProblems || 0, icon: <CodeOutlined />, color: 'blue', gradient: 'linear-gradient(135deg, #4f46e5, #818cf8)' },
    { title: '比赛', value: stats?.totalContests || 0, icon: <TrophyOutlined />, color: 'green', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { title: '课程', value: stats?.totalCourses || 0, icon: <BookOutlined />, color: 'orange', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { title: '提交', value: stats?.totalSubmissions || 0, icon: <ThunderboltOutlined />, color: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  ]

  const featureCards = [
    { title: '题目练习', desc: '丰富的题库涵盖多种难度，支持 C++、Python 实时评测', icon: <CodeOutlined />, color: '#4f46e5', action: '/problems', label: '开始练习' },
    { title: '在线比赛', desc: '与其他选手同台竞技，实时排名，挑战自我极限', icon: <TrophyOutlined />, color: '#10b981', action: '/contests', label: '查看比赛' },
    { title: 'AI 助手', desc: '智能分析代码、优化算法，提供个性化学习指导', icon: <BulbOutlined />, color: '#f59e0b', action: '/ai', label: '开始对话' },
    { title: '博客 / 题解', desc: '分享解题思路，学习他人经验，共同进步', icon: <ReadOutlined />, color: '#8b5cf6', action: '/articles', label: '浏览文章' },
    { title: '排行榜', desc: '查看全局排名，了解自己的实力水平', icon: <CrownOutlined />, color: '#ea580c', action: '/leaderboard', label: '查看排名' },
    ...(user.role === 'admin' || user.role === 'teacher'
      ? [{ title: '管理后台', desc: '管理题目、用户、竞赛和课程，查看系统统计', icon: <SettingOutlined />, color: '#64748b', action: '/admin', label: '进入管理' }]
      : []),
  ]

  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'
  const numColor = isDark ? '#e0e0e0' : '#1a1a2e'
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : '#8c8c8c'
  const iconBgOpacity = isDark ? '0.15' : '1'

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Title level={1} style={{ color: 'white', marginBottom: 8, fontSize: 32 }}>
            欢迎回来，{user.username || '同学'}！
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 24, maxWidth: 500 }}>
            面向信息学竞赛的智能在线评测系统，集成 AI 助手，让编程学习更高效
          </Paragraph>
          <Space size={12}>
            <Button
              size="large"
              icon={<CodeOutlined />}
              onClick={() => navigate('/problems')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: 10,
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
                height: 44,
                paddingInline: 24,
              }}
            >
              开始刷题
            </Button>
            <Button
              size="large"
              ghost
              icon={<RobotOutlined />}
              onClick={() => navigate('/ai')}
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: 10,
                height: 44,
                paddingInline: 24,
              }}
            >
              AI 助手
            </Button>
          </Space>
          {user.solved_count > 0 && (
            <div style={{ marginTop: 24, maxWidth: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>已解决</Text>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                  {user.solved_count} / {stats?.totalProblems || 440}
                </Text>
              </div>
              <Progress
                percent={Math.round((user.solved_count / ((stats?.totalProblems || 440) || 1)) * 100)}
                strokeColor="#fff"
                trailColor="rgba(255,255,255,0.2)"
                showInfo={false}
                size="small"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map(card => (
          <Col xs={12} sm={12} md={6} key={card.title}>
            <Card className={`stat-card stat-card-${card.color}`} style={{ borderRadius: 12, background: cardBg, borderColor: cardBorder }} loading={loading}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: card.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 20, opacity: Number(iconBgOpacity) > 0 ? undefined : 0.5,
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: numColor }}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </div>
                  <div style={{ fontSize: 13, color: labelColor }}>{card.title}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Feature Cards */}
      <Row gutter={[16, 16]}>
        {featureCards.map(card => (
          <Col xs={24} sm={12} md={8} key={card.title}>
            <Card
              className="feature-card"
              hoverable
              onClick={() => navigate(card.action)}
              style={{ cursor: 'pointer', borderRadius: 12, background: cardBg, borderColor: cardBorder }}
              styles={{ body: { padding: 20 } }}
            >
              <div className="feature-icon" style={{
                background: isDark ? `${card.color}22` : `${card.color}15`,
                color: card.color,
              }}>
                {card.icon}
              </div>
              <Title level={5} style={{ marginBottom: 4, color: numColor }}>{card.title}</Title>
              <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13, minHeight: 40 }}>
                {card.desc}
              </Paragraph>
              <Button type="link" style={{ padding: 0, color: card.color, fontWeight: 600 }} icon={<ArrowRightOutlined />}>
                {card.label}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Home

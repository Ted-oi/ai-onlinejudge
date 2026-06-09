import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Typography, Space, Progress, List, Tag } from 'antd'
import {
  CodeOutlined,
  TrophyOutlined,
  BookOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  ReadOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  CompassOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { adminService } from '../../services/admin.service'
import { submissionService } from '../../services/submission.service'
import statsService from '../../services/stats.service'
import { useTheme } from '../../components/common/ThemeSwitcher'
import useCountUp from '../../hooks/useCountUp'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Title, Paragraph, Text } = Typography

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#52c41a',
  medium: '#faad14',
  hard: '#ff4d4f',
}
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const StatCard = ({ card, loading, isDark, delay }: any) => {
  const animated = useCountUp(card.value, loading)
  const numColor = isDark ? '#e0e0e0' : '#1a1a2e'
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : '#8c8c8c'
  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'

  return (
    <div className="stagger-fade-in" style={{ animationDelay: `${delay}s` }}>
      <Card className={`stat-card stat-card-${card.color}`} style={{ borderRadius: 12, background: cardBg, borderColor: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: card.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20,
          }}>
            {card.icon}
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: numColor }}>
              {loading ? '-' : animated.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: labelColor }}>{card.title}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

const Home = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
  const [diffData, setDiffData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [statData, subData] = await Promise.all([
        adminService.getPublicStats(),
        submissionService.getSubmissions({ page: 1, limit: 5 }).catch(() => []),
      ])
      setStats(statData)
      setRecentSubmissions(Array.isArray(subData) ? subData.slice(0, 5) : [])

      // Load chart data in parallel (non-blocking)
      statsService.getSubmissionTrend().then(d => setTrendData(d || [])).catch(() => {})
      statsService.getDifficultyDistribution().then(d => setDiffData(d || [])).catch(() => {})
    } catch (error) { console.error(error) } finally {
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
    { title: 'Playground', desc: '自由编码环境，无需关联题目，随时运行测试代码', icon: <ExperimentOutlined />, color: '#06b6d4', action: '/playground', label: '开始编码' },
    { title: '博客 / 题解', desc: '分享解题思路，学习他人经验，共同进步', icon: <ReadOutlined />, color: '#8b5cf6', action: '/articles', label: '浏览文章' },
    { title: '排行榜', desc: '查看全局排名，了解自己的实力水平', icon: <CrownOutlined />, color: '#ea580c', action: '/leaderboard', label: '查看排名' },
    ...(user.role === 'admin' || user.role === 'teacher'
      ? [{ title: '管理后台', desc: '管理题目、用户、竞赛和课程，查看系统统计', icon: <SettingOutlined />, color: '#64748b', action: '/admin', label: '进入管理' }]
      : []),
  ]

  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'
  const numColor = isDark ? '#e0e0e0' : '#1a1a2e'

  const statusIcon: Record<string, any> = {
    accepted: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    wrong_answer: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  }

  const gridColor = isDark ? '#333' : '#f0f0f0'
  const axisColor = isDark ? 'rgba(255,255,255,0.45)' : '#999'

  // Fill trend gaps for continuous area chart
  const filledTrend = (() => {
    if (trendData.length === 0) return []
    const map = new Map(trendData.map((d: any) => [d.date, d]))
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day')
      const key = d.format('YYYY-MM-DD')
      const entry = map.get(key)
      result.push({
        date: d.format('M/D'),
        total: entry ? parseInt(entry.total) : 0,
        accepted: entry ? parseInt(entry.accepted) : 0,
      })
    }
    return result
  })()

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner stagger-fade-in" style={{ marginBottom: 24, animationDelay: '0s' }}>
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
              icon={<ExperimentOutlined />}
              onClick={() => navigate('/playground')}
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: 10,
                height: 44,
                paddingInline: 24,
              }}
            >
              Playground
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

      {/* New user guide */}
      {!loading && user.solved_count === 0 && (
        <Card
          style={{
            marginBottom: 24, borderRadius: 12, background: isDark ? '#1f1f1f' : '#fff',
            borderColor: isDark ? '#303030' : '#f0f0f0',
            borderLeft: `4px solid ${isDark ? '#818cf8' : '#4f46e5'}`,
          }}
          className="stagger-fade-in"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <RocketOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
            <Title level={5} style={{ margin: 0, color: numColor }}>快速开始</Title>
          </div>
          <Space size={16} wrap>
            <Button type="primary" icon={<CodeOutlined />} onClick={() => navigate('/problems')}>试做第一道题</Button>
            <Button icon={<ExperimentOutlined />} onClick={() => navigate('/playground')}>代码 Playground</Button>
            <Button icon={<CompassOutlined />} onClick={() => navigate('/learning-paths')}>探索学习路径</Button>
          </Space>
        </Card>
      )}

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, idx) => (
          <Col xs={12} sm={12} md={6} key={card.title}>
            <StatCard card={card} loading={loading} isDark={isDark} delay={0.1 + idx * 0.08} />
          </Col>
        ))}
      </Row>

      {/* Charts Row: Trend + Difficulty */}
      {(filledTrend.length > 0 || diffData.length > 0) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {filledTrend.length > 0 && (
            <Col xs={24} md={16}>
              <Card
                title="提交趋势（近 30 天）"
                style={{ borderRadius: 12, background: cardBg, borderColor: cardBorder }}
                className="stagger-fade-in"
              >
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={filledTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} />
                    <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#1f1f1f' : '#fff',
                        border: `1px solid ${isDark ? '#444' : '#e8e8e8'}`,
                        borderRadius: 8,
                        color: isDark ? '#e0e0e0' : '#333',
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} name="总提交" strokeWidth={2} />
                    <Area type="monotone" dataKey="accepted" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="已通过" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}
          {diffData.length > 0 && (
            <Col xs={24} md={8}>
              <Card
                title="已解题目难度分布"
                style={{ borderRadius: 12, background: cardBg, borderColor: cardBorder }}
                className="stagger-fade-in"
              >
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={diffData.map((d: any) => ({
                        name: DIFFICULTY_LABELS[d.difficulty] || d.difficulty,
                        value: parseInt(d.solved),
                        color: DIFFICULTY_COLORS[d.difficulty] || '#888',
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}`}
                    >
                      {diffData.map((d: any, i: number) => (
                        <Cell key={i} fill={DIFFICULTY_COLORS[d.difficulty] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#1f1f1f' : '#fff',
                        border: `1px solid ${isDark ? '#444' : '#e8e8e8'}`,
                        borderRadius: 8,
                        color: isDark ? '#e0e0e0' : '#333',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Feature Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {featureCards.map((card, idx) => (
          <Col xs={24} sm={12} md={8} key={card.title}>
            <div className="stagger-fade-in" style={{ animationDelay: `${0.3 + idx * 0.06}s` }}>
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
            </div>
          </Col>
        ))}
      </Row>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <Card
          title={<Space><ClockCircleOutlined />最近提交</Space>}
          style={{ borderRadius: 12, background: cardBg, borderColor: cardBorder }}
          extra={<Button type="link" onClick={() => navigate('/submissions')}>查看全部</Button>}
          className="stagger-fade-in"
        >
          <List
            size="small"
            dataSource={recentSubmissions.slice(0, 5)}
            renderItem={(sub: any) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/submissions/${sub.id}`)}
              >
                <List.Item.Meta
                  avatar={statusIcon[sub.status] || <ClockCircleOutlined style={{ color: '#999' }} />}
                  title={
                    <Space>
                      <span style={{ color: numColor }}>#{sub.id}</span>
                      <Tag color={sub.status === 'accepted' ? 'success' : sub.status === 'wrong_answer' ? 'error' : 'processing'}>
                        {sub.status === 'accepted' ? '通过' : sub.status === 'wrong_answer' ? '答案错误' : sub.status}
                      </Tag>
                    </Space>
                  }
                  description={`${sub.language || 'C++'} · ${dayjs(sub.created_at).fromNow()}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  )
}

export default Home

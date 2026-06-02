import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Tag, Button, Table, Statistic, Spin, Avatar, Tabs, Empty } from 'antd'
import { ArrowLeftOutlined, UserOutlined, TrophyOutlined, CodeOutlined, CheckCircleOutlined, EditOutlined, BookOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import userService from '../../services/user.service'
import { submissionService } from '../../services/submission.service'
import type { User, UserAchievement, SolvedProblem } from '../../types'
import SkillRadarChart from '../../components/user/SkillRadarChart'
import ActivityHeatmap from '../../components/user/ActivityHeatmap'
import AchievementBadgeGrid from '../../components/user/AchievementBadgeGrid'
import RatingChart from '../../components/user/RatingChart'

const { Title, Text } = Typography

const difficultyConfig: Record<string, { color: string; label: string }> = {
  easy: { color: '#10b981', label: '简单' },
  medium: { color: '#f59e0b', label: '中等' },
  hard: { color: '#ef4444', label: '困难' },
}

const statusLabels: Record<string, string> = {
  accepted: '通过', wrong_answer: '答案错误', time_limit_exceeded: '超时',
  memory_limit_exceeded: '超内存', runtime_error: '运行错误',
  compilation_error: '编译错误', pending: '等待中',
}
const statusColors: Record<string, string> = {
  accepted: '#52c41a', wrong_answer: '#ff4d4f', time_limit_exceeded: '#faad14',
  memory_limit_exceeded: '#faad14', runtime_error: '#ff4d4f',
  compilation_error: '#ff4d4f', pending: '#d9d9d9',
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [solvedProblems, setSolvedProblems] = useState<SolvedProblem[]>([])
  const [solvedTotal, setSolvedTotal] = useState(0)
  const [ratingHistory, setRatingHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isSelf = currentUser.id === Number(id)

  useEffect(() => {
    if (id) fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [profileData, submissions, solved, ratings] = await Promise.all([
        userService.getPublicProfile(Number(id)),
        submissionService.getSubmissions({ user_id: Number(id), limit: 10 }).catch(() => ({ submissions: [] })),
        userService.getSolvedProblems(Number(id), { limit: 50 }).catch(() => ({ problems: [], total: 0 })),
        userService.getRatingHistory(Number(id)).catch(() => []),
      ])

      setUser(profileData.user)
      setAchievements(profileData.achievements)
      setRecentSubmissions((submissions as any)?.submissions || submissions || [])
      setSolvedProblems(solved.problems)
      setSolvedTotal(solved.total)
      setRatingHistory(ratings as any[])

      if (isSelf) {
        userService.checkBadges(Number(id)).catch(() => {})
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => ({ student: '学生', teacher: '教师', admin: '管理员' }[role] || role)
  const getRoleColor = (role: string) => ({ student: 'blue', teacher: 'green', admin: 'red' }[role] || 'default')

  const submissionColumns = [
    {
      title: '题目', dataIndex: 'problem_id', key: 'problem_id',
      render: (pid: number) => <Button type="link" size="small" onClick={() => navigate(`/problems/${pid}`)}>#{pid}</Button>,
    },
    { title: '语言', dataIndex: 'language', key: 'language' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>,
    },
    {
      title: '运行时间', dataIndex: 'runtime', key: 'runtime',
      render: (runtime: number) => runtime ? `${runtime}ms` : '-',
    },
    {
      title: '提交时间', dataIndex: 'created_at', key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ]

  const solvedColumns = [
    {
      title: '题目', dataIndex: 'title', key: 'title',
      render: (title: string, record: SolvedProblem) => (
        <Button type="link" size="small" onClick={() => navigate(`/problems/${record.problem_id}`)}>
          {record.problem_id}. {title}
        </Button>
      ),
    },
    {
      title: '难度', dataIndex: 'difficulty', key: 'difficulty',
      render: (d: string) => { const c = difficultyConfig[d]; return c ? <Tag color={c.color}>{c.label}</Tag> : d },
    },
    {
      title: '分类', dataIndex: 'category', key: 'category',
      render: (c: string) => <Tag>{c}</Tag>,
    },
    {
      title: '解决时间', dataIndex: 'solved_at', key: 'solved_at',
      render: (t: string) => new Date(t).toLocaleDateString(),
    },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>

  if (!user) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4} type="secondary">用户不存在</Title>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </Card>
    )
  }

  const getColor = (rating: number) => {
    if (rating >= 2400) return '#ff0000'
    if (rating >= 2000) return '#ff8c00'
    if (rating >= 1600) return '#aa00aa'
    if (rating >= 1200) return '#0000ff'
    return '#888'
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>

      {/* Profile Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <Avatar size={80} icon={<UserOutlined />} src={user.avatar} style={{ backgroundColor: '#4f46e5', fontSize: 36 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <Title level={3} style={{ margin: 0, color: getColor(user.rating) }}>{user.username}</Title>
              <Tag color={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Tag>
            </div>
            {user.bio && <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{user.bio}</Text>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {user.school && <Text type="secondary"><BookOutlined /> {user.school}</Text>}
              {user.organization && <Text type="secondary">{user.organization}</Text>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Statistic title="Rating" value={user.rating} prefix={<TrophyOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: getColor(user.rating) }} />
            {isSelf && (
              <Button icon={<EditOutlined />} onClick={() => navigate(`/users/${user.id}/settings`)} style={{ marginTop: 8 }}>编辑资料</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="已解决" value={user.solved_count} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="总提交" value={user.submit_count} prefix={<CodeOutlined />} valueStyle={{ color: '#4f46e5' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="通过率" value={user.submit_count > 0 ? Math.round((user.solved_count / user.submit_count) * 100) : 0} suffix="%" valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="成就" value={achievements.length} prefix={<TrophyOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
      </Row>

      {/* Tabbed Content */}
      <Card>
        <Tabs defaultActiveKey="overview" items={[
          {
            key: 'overview',
            label: '概览',
            children: (
              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Card title="成就徽章" size="small" style={{ marginBottom: 16 }}>
                    <AchievementBadgeGrid achievements={achievements} />
                  </Card>
                  <Card title="技能分布" size="small">
                    <SkillRadarChart userId={Number(id)} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Rating 变化" size="small" style={{ marginBottom: 16 }}>
                    <RatingChart history={ratingHistory} />
                  </Card>
                  <Card title="活跃度" size="small">
                    <ActivityHeatmap userId={Number(id)} />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'solved',
            label: `已解决 (${solvedTotal})`,
            children: solvedProblems.length > 0 ? (
              <Table columns={solvedColumns} dataSource={solvedProblems} rowKey="problem_id" size="small"
                pagination={{ pageSize: 20, total: solvedTotal, showTotal: t => `共 ${t} 题` }} />
            ) : <Empty description="暂未解决题目" />,
          },
          {
            key: 'submissions',
            label: '最近提交',
            children: (
              <Table columns={submissionColumns} dataSource={recentSubmissions} rowKey="id" pagination={false} size="small" />
            ),
          },
        ]} />
      </Card>
    </div>
  )
}

export default UserProfile

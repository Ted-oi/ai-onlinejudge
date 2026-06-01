import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Tag, Button, Table, Statistic, Spin, Avatar } from 'antd'
import { ArrowLeftOutlined, UserOutlined, TrophyOutlined, CodeOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import userService from '../../services/user.service'
import { submissionService } from '../../services/submission.service'
import type { User } from '../../types'
import SkillRadarChart from '../../components/user/SkillRadarChart'
import ActivityHeatmap from '../../components/user/ActivityHeatmap'

const { Title, Text } = Typography

const UserProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isSelf = currentUser.id === Number(id)

  useEffect(() => {
    if (id) fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [userData, statsData, submissions] = await Promise.all([
        userService.getUserById(Number(id)),
        userService.getUserStats(Number(id)),
        submissionService.getSubmissions({ user_id: Number(id), limit: 10 }).catch(() => []),
      ])
      setUser(userData)
      setStats(statsData)
      setRecentSubmissions(submissions)
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: '学生',
      teacher: '教师',
      admin: '管理员',
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      student: 'blue',
      teacher: 'green',
      admin: 'red',
    }
    return colors[role] || 'default'
  }

  const statusLabels: Record<string, string> = {
    accepted: '通过',
    wrong_answer: '答案错误',
    time_limit_exceeded: '超时',
    memory_limit_exceeded: '超内存',
    runtime_error: '运行错误',
    compilation_error: '编译错误',
    pending: '等待中',
  }

  const statusColors: Record<string, string> = {
    accepted: '#52c41a',
    wrong_answer: '#ff4d4f',
    time_limit_exceeded: '#faad14',
    memory_limit_exceeded: '#faad14',
    runtime_error: '#ff4d4f',
    compilation_error: '#ff4d4f',
    pending: '#d9d9d9',
  }

  const submissionColumns = [
    {
      title: '题目ID',
      dataIndex: 'problem_id',
      key: 'problem_id',
      render: (id: number) => (
        <Button type="link" size="small" onClick={() => navigate(`/problems/${id}`)}>
          #{id}
        </Button>
      ),
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: '运行时间',
      dataIndex: 'runtime',
      key: 'runtime',
      render: (runtime: number) => runtime ? `${runtime}ms` : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

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

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      {/* User info card */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} src={user.avatar} style={{ backgroundColor: '#1677ff', fontSize: 36 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Title level={3} style={{ margin: 0 }}>{user.username}</Title>
              <Tag color={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Tag>
            </div>
            <Text type="secondary">{user.email}</Text>
            {user.bio && (
              <div style={{ marginTop: 8, color: '#666' }}>{user.bio}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              <Statistic
                title="Rating"
                value={user.rating}
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </div>
            {isSelf && (
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/users/${user.id}/settings`)}
              >
                编辑资料
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="已解决"
              value={user.solved_count}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总提交"
              value={user.submit_count}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="通过率"
              value={user.submit_count > 0 ? Math.round((user.solved_count / user.submit_count) * 100) : 0}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Submission status breakdown */}
      {stats?.submissions_by_status && stats.submissions_by_status.length > 0 && (
        <Card title="提交状态分布" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {stats.submissions_by_status.map((item: any) => (
              <Col span={4} key={item.status}>
                <Statistic
                  title={statusLabels[item.status] || item.status}
                  value={Number(item.count)}
                  valueStyle={{ color: statusColors[item.status], fontSize: 20 }}
                />
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Recent submissions */}
      <Card title="最近提交" style={{ marginBottom: 16 }}>
        <Table
          columns={submissionColumns}
          dataSource={recentSubmissions}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Skill radar and activity heatmap */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <SkillRadarChart userId={Number(id)} />
        </Col>
        <Col xs={24} lg={12}>
          <ActivityHeatmap userId={Number(id)} />
        </Col>
      </Row>
    </div>
  )
}

export default UserProfile

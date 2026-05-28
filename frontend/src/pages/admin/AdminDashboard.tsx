import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Spin } from 'antd'
import {
  UserOutlined,
  CodeOutlined,
  FileTextOutlined,
  TrophyOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/admin.service'

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    accepted: 'green',
    wrong_answer: 'red',
    time_limit_exceeded: 'orange',
    memory_limit_exceeded: 'orange',
    runtime_error: 'volcano',
    compilation_error: 'magenta',
    pending: 'blue',
    judging: 'cyan',
    system_error: 'default',
  }

  const statusLabels: Record<string, string> = {
    accepted: '通过',
    wrong_answer: '答案错误',
    time_limit_exceeded: '超时',
    memory_limit_exceeded: '内存超限',
    runtime_error: '运行错误',
    compilation_error: '编译错误',
    pending: '等待中',
    judging: '评测中',
    system_error: '系统错误',
  }

  const quickLinks = [
    { title: '题目管理', icon: <CodeOutlined />, color: '#1890ff', path: '/admin/problems' },
    { title: '用户管理', icon: <UserOutlined />, color: '#52c41a', path: '/admin/users' },
    { title: '竞赛管理', icon: <TrophyOutlined />, color: '#faad14', path: '/admin/contests' },
    { title: '课程管理', icon: <BookOutlined />, color: '#722ed1', path: '/admin/courses' },
  ]

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '用户',
      dataIndex: 'username',
      width: 100,
    },
    {
      title: '题目',
      dataIndex: 'problem_title',
      ellipsis: true,
    },
    {
      title: '语言',
      dataIndex: 'language',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ]

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理仪表盘</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="用户总数" value={stats?.totalUsers || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="题目总数" value={stats?.totalProblems || 0} prefix={<CodeOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="提交总数" value={stats?.totalSubmissions || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="竞赛数" value={stats?.totalContests || 0} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="课程数" value={stats?.totalCourses || 0} prefix={<BookOutlined />} />
          </Card>
        </Col>
      </Row>

      {stats?.statusBreakdown?.length > 0 && (
        <Card title="提交状态分布" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 8]}>
            {stats.statusBreakdown.map((item: any) => (
              <Col key={item.status} xs={12} sm={8} md={6}>
                <Tag color={statusColors[item.status]} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {statusLabels[item.status] || item.status}: {item.count}
                </Tag>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card title="最近提交">
            <Table
              dataSource={stats?.recentSubmissions || []}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="快捷入口" style={{ marginTop: 0 }}>
            <Row gutter={[16, 16]}>
              {quickLinks.map(link => (
                <Col span={12} key={link.path}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center' }}
                    onClick={() => navigate(link.path)}
                  >
                    <div style={{ fontSize: 32, color: link.color, marginBottom: 8 }}>
                      {link.icon}
                    </div>
                    <div>{link.title}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard

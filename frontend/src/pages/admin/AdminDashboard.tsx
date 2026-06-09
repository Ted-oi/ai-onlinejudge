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
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { adminService } from '../../services/admin.service'
import statsService from '../../services/stats.service'
import { useTheme } from '../../components/common/ThemeSwitcher'

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null)
  const [adminTrend, setAdminTrend] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
      statsService.getAdminTrend().then(d => setAdminTrend(d)).catch(() => {})
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    accepted: '#52c41a',
    wrong_answer: '#ff4d4f',
    time_limit_exceeded: '#faad14',
    memory_limit_exceeded: '#faad14',
    runtime_error: '#fa541c',
    compilation_error: '#eb2f96',
    pending: '#1890ff',
    judging: '#13c2c2',
    system_error: '#8c8c8c',
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

  const gridColor = isDark ? '#333' : '#f0f0f0'
  const axisColor = isDark ? 'rgba(255,255,255,0.45)' : '#999'
  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'

  // Pie chart data for status breakdown
  const pieData = (stats?.statusBreakdown || []).map((item: any) => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
    color: statusColors[item.status] || '#8c8c8c',
  }))

  // Bar chart data for submission trend (last 7 days)
  const barData = (() => {
    if (!adminTrend?.submissions) return []
    const map = new Map(adminTrend.submissions.map((d: any) => [d.date, d]))
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const entry = map.get(key) as any
      result.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        提交数: entry ? parseInt(entry.total) : 0,
      })
    }
    return result
  })()

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理仪表盘</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card style={{ background: cardBg, borderColor: cardBorder }}>
            <Statistic title="用户总数" value={stats?.totalUsers || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={{ background: cardBg, borderColor: cardBorder }}>
            <Statistic title="题目总数" value={stats?.totalProblems || 0} prefix={<CodeOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={{ background: cardBg, borderColor: cardBorder }}>
            <Statistic title="提交总数" value={stats?.totalSubmissions || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={{ background: cardBg, borderColor: cardBorder }}>
            <Statistic title="竞赛数" value={stats?.totalContests || 0} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card style={{ background: cardBg, borderColor: cardBorder }}>
            <Statistic title="课程数" value={stats?.totalCourses || 0} prefix={<BookOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        {/* Status Breakdown Pie Chart */}
        {pieData.length > 0 && (
          <Col xs={24} lg={10}>
            <Card
              title="提交状态分布"
              style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}
            >
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: isDark ? '#555' : '#999' }}
                  >
                    {pieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
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

        {/* Submission Trend Bar Chart */}
        <Col xs={24} lg={14}>
          <Card
            title="提交趋势（近 7 天）"
            style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#1f1f1f' : '#fff',
                    border: `1px solid ${isDark ? '#444' : '#e8e8e8'}`,
                    borderRadius: 8,
                    color: isDark ? '#e0e0e0' : '#333',
                  }}
                />
                <Bar dataKey="提交数" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card title="最近提交" style={{ background: cardBg, borderColor: cardBorder }}>
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
          <Card title="快捷入口" style={{ marginTop: 0, background: cardBg, borderColor: cardBorder }}>
            <Row gutter={[16, 16]}>
              {quickLinks.map(link => (
                <Col span={12} key={link.path}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', background: cardBg, borderColor: cardBorder }}
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

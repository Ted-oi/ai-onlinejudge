import { useState, useEffect } from 'react'
import { Table, Input, Select, Tag, message, Card, Statistic, Row, Col } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import userService from '../../services/user.service'
import { adminService } from '../../services/admin.service'
import type { User } from '../../types'

const { Search } = Input

const roleMap: Record<string, { color: string; label: string }> = {
  admin: { color: 'red', label: '管理员' },
  teacher: { color: 'blue', label: '教师' },
  student: { color: 'green', label: '学生' },
}

const AdminUserList = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | undefined>()
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [userStats, setUserStats] = useState<any>(null)

  useEffect(() => {
    loadUsers()
  }, [search, roleFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await userService.getLeaderboard({
        search: search || undefined,
        role: roleFilter || undefined,
        limit: 100,
      })
      setUsers(data.users)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole)
      message.success('角色已更新')
      loadUsers()
    } catch {
      // handled
    }
  }

  const handleExpand = async (userId: number) => {
    if (expandedUser === userId) {
      setExpandedUser(null)
      return
    }
    setExpandedUser(userId)
    try {
      const stats = await userService.getUserStats(userId)
      setUserStats(stats)
    } catch {
      // handled
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 140,
      render: (role: string, record: User) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role === 'admin') {
          return (
            <Select
              value={role}
              size="small"
              style={{ width: 110 }}
              onChange={(v) => handleRoleChange(record.id, v)}
              options={[
                { label: '学生', value: 'student' },
                { label: '教师', value: 'teacher' },
                { label: '管理员', value: 'admin' },
              ]}
            />
          )
        }
        const info = roleMap[role]
        return <Tag color={info?.color}>{info?.label || role}</Tag>
      },
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      width: 80,
      sorter: (a: User, b: User) => a.rating - b.rating,
    },
    {
      title: '已解决',
      dataIndex: 'solved_count',
      width: 80,
      sorter: (a: User, b: User) => a.solved_count - b.solved_count,
    },
    {
      title: '提交数',
      dataIndex: 'submit_count',
      width: 80,
      sorter: (a: User, b: User) => a.submit_count - b.submit_count,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>用户管理</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Search
          placeholder="搜索用户名或邮箱"
          allowClear
          onSearch={setSearch}
          style={{ width: 300 }}
        />
        <Select
          placeholder="角色筛选"
          allowClear
          style={{ width: 120 }}
          onChange={setRoleFilter}
          options={[
            { label: '学生', value: 'student' },
            { label: '教师', value: 'teacher' },
            { label: '管理员', value: 'admin' },
          ]}
        />
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => handleExpand(record.id),
          style: { cursor: 'pointer' },
        })}
        expandable={{
          expandedRowKeys: expandedUser ? [expandedUser] : [],
          expandedRowRender: () => {
            if (!userStats) return null
            return (
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="已解决" value={userStats.solved_count} prefix={<UserOutlined />} />
                  </Card>
                </Col>
                {userStats.submissions_by_status?.map((s: any) => (
                  <Col span={4} key={s.status}>
                    <Card size="small">
                      <Statistic title={s.status} value={s.count} />
                    </Card>
                  </Col>
                ))}
              </Row>
            )
          },
        }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </div>
  )
}

export default AdminUserList

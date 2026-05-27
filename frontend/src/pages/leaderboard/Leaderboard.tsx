import { useState, useEffect } from 'react'
import { Table, Card, Tag, Avatar, Input, Select, Space } from 'antd'
import { TrophyOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { User } from '../../types'
import userService from '../../services/user.service'

const { Search } = Input

const ratingColor = (rating: number) => {
  if (rating >= 2000) return '#ff4d4f'
  if (rating >= 1600) return '#ff7a45'
  if (rating >= 1200) return '#ffc53d'
  if (rating >= 800) return '#52c41a'
  return '#8c8c8c'
}

const ratingTitle = (rating: number) => {
  if (rating >= 2000) return 'Grandmaster'
  if (rating >= 1600) return 'Master'
  if (rating >= 1200) return 'Expert'
  if (rating >= 800) return 'Pupil'
  return 'Newbie'
}

const roleLabel: Record<string, string> = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
}

const Leaderboard = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [roleFilter, setRoleFilter] = useState<string | undefined>()
  const [searchText, setSearchText] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { users: data } = await userService.getLeaderboard({
        page: pagination.current,
        limit: pagination.pageSize,
        role: roleFilter,
        search: searchText || undefined,
      })
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [pagination.current, pagination.pageSize, roleFilter])

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_: any, __: any, index: number) => {
        const rank = (pagination.current - 1) * pagination.pageSize + index + 1
        if (rank === 1) return <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 18 }}>1</span>
        if (rank === 2) return <span style={{ color: '#c0c0c0', fontWeight: 'bold', fontSize: 16 }}>2</span>
        if (rank === 3) return <span style={{ color: '#cd7f32', fontWeight: 'bold', fontSize: 16 }}>3</span>
        return rank
      },
    },
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate(`/users/${record.id}`)}>
          <Avatar size="small" icon={<UserOutlined />} src={record.avatar} />
          <span style={{ fontWeight: 500 }}>{record.username}</span>
          <Tag color={record.role === 'admin' ? 'red' : record.role === 'teacher' ? 'blue' : 'default'}>
            {roleLabel[record.role] || record.role}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      sorter: (a: User, b: User) => a.rating - b.rating,
      render: (rating: number) => (
        <span style={{ color: ratingColor(rating), fontWeight: 'bold' }}>
          {rating} ({ratingTitle(rating)})
        </span>
      ),
    },
    {
      title: '已解题数',
      dataIndex: 'solved_count',
      key: 'solved_count',
      width: 100,
      sorter: (a: User, b: User) => a.solved_count - b.solved_count,
      render: (count: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{count}</span>,
    },
    {
      title: '提交数',
      dataIndex: 'submit_count',
      key: 'submit_count',
      width: 100,
      sorter: (a: User, b: User) => a.submit_count - b.submit_count,
    },
    {
      title: '通过率',
      key: 'ac_rate',
      width: 100,
      sorter: (a: User, b: User) => (a.submit_count ? a.solved_count / a.submit_count : 0) - (b.submit_count ? b.solved_count / b.submit_count : 0),
      render: (_: any, record: User) => {
        const rate = record.submit_count ? Math.round((record.solved_count / record.submit_count) * 100) : 0
        return <span style={{ color: rate >= 60 ? '#52c41a' : rate >= 30 ? '#faad14' : '#ff4d4f' }}>{rate}%</span>
      },
    },
  ]

  return (
    <div>
      <Card
        title={
          <span style={{ fontSize: 18 }}>
            <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
            排行榜
          </span>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="搜索用户名"
            allowClear
            onSearch={(value) => {
              setSearchText(value)
              setPagination((p) => ({ ...p, current: 1 }))
              fetchUsers()
            }}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="角色筛选"
            allowClear
            style={{ width: 120 }}
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value)
              setPagination((p) => ({ ...p, current: 1 }))
            }}
            options={[
              { label: '学生', value: 'student' },
              { label: '教师', value: 'teacher' },
              { label: '管理员', value: 'admin' },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 人`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </Card>
    </div>
  )
}

export default Leaderboard

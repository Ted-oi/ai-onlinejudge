import { useState, useEffect } from 'react'
import { Table, Button, Tag, Popconfirm, Space, Tabs, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import contestService from '../../services/contest.service'
import type { Contest } from '../../types/contest'

const AdminContestList = () => {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const navigate = useNavigate()

  useEffect(() => {
    loadContests()
  }, [statusFilter])

  const loadContests = async () => {
    setLoading(true)
    try {
      const data = await contestService.getContests(
        statusFilter ? { status: statusFilter as any } : undefined
      )
      setContests(data)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await contestService.deleteContest(id)
      message.success('删除成功')
      loadContests()
    } catch {
      // handled
    }
  }

  const getContestStatus = (contest: Contest) => {
    const now = Date.now()
    const start = new Date(contest.start_time).getTime()
    const end = new Date(contest.end_time).getTime()
    if (now < start) return { label: '未开始', color: 'blue' }
    if (now <= end) return { label: '进行中', color: 'green' }
    return { label: '已结束', color: 'default' }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: Contest) => {
        const s = getContestStatus(record)
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 140,
      render: (_: any, record: Contest) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/admin/contests/${record.id}/edit`)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此竞赛？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>竞赛管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/contests/create')}>
          创建竞赛
        </Button>
      </div>

      <Tabs
        items={[
          { key: 'all', label: '全部' },
          { key: 'upcoming', label: '未开始' },
          { key: 'ongoing', label: '进行中' },
          { key: 'past', label: '已结束' },
        ]}
        onChange={(key) => setStatusFilter(key === 'all' ? undefined : key)}
      />

      <Table
        dataSource={contests}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}

export default AdminContestList

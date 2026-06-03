import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Popconfirm, Input, message, Typography, Avatar } from 'antd'
import { DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import codeShareService from '../../services/codeShare.service'

const { Title } = Typography
const { Search } = Input

const langMap: Record<string, string> = {
  cpp: 'C++', c: 'C', python: 'Python', java: 'Java',
}

const AdminCodeShareList = () => {
  const [codes, setCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const data = await codeShareService.getSharedCodes({
        page,
        limit: 15,
        search: search || undefined,
      })
      setCodes(data.codes || [])
      setTotal(data.total || 0)
    } catch (error) { console.error(error) } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { fetchCodes() }, [page])

  const handleDelete = async (id: number) => {
    try {
      await codeShareService.deleteSharedCode(id)
      message.success('删除成功')
      fetchCodes()
    } catch (error) { console.error(error) }
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
      title: '作者',
      key: 'author',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Avatar size={20} icon={<UserOutlined />} />
          <span>{record.username || `User#${record.user_id}`}</span>
        </Space>
      ),
    },
    {
      title: '语言',
      dataIndex: 'language',
      width: 80,
      render: (l: string) => <Tag>{langMap[l] || l}</Tag>,
    },
    {
      title: '关联题目',
      dataIndex: 'problem_id',
      width: 90,
      render: (pid: number) => pid ? `P${pid}` : '-',
    },
    {
      title: '点赞/评论',
      key: 'engagement',
      width: 100,
      render: (_: any, record: any) => (
        <span>{record.like_count || 0} / {record.comment_count || 0}</span>
      ),
    },
    {
      title: '公开',
      dataIndex: 'is_public',
      width: 70,
      render: (v: boolean) => v ? <Tag color="green">是</Tag> : <Tag color="default">否</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 120,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 100,
      render: (_: any, record: any) => (
        <Popconfirm title="确定删除此代码分享？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Title level={4}>代码分享管理</Title>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索标题"
          allowClear
          onSearch={setSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
      </div>

      <Table
        columns={columns}
        dataSource={codes}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 15,
          onChange: setPage,
          showTotal: t => `共 ${t} 条`,
        }}
      />
    </div>
  )
}

export default AdminCodeShareList

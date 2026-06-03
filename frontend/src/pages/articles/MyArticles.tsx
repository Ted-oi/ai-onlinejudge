import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Space, Typography, Popconfirm, message, Select } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import articleService from '../../services/article.service'
import type { Article } from '../../types/article'

const { Title } = Typography

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'gold', text: '审核中' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '未通过' },
}

const MyArticles = () => {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 15 }
      if (status) params.status = status
      const data = await articleService.getMyArticles(params)
      setArticles(data.articles || [])
      setTotal(data.total || 0)
    } catch (error) { console.error(error) } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticles() }, [page, status])

  const handleDelete = async (id: number) => {
    await articleService.deleteArticle(id)
    message.success('已删除')
    fetchArticles()
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Article) => (
        <Space>
          <Tag color={record.type === 'solution' ? 'green' : 'blue'}>
            {record.type === 'solution' ? '题解' : '博客'}
          </Tag>
          <span>{text}</span>
          {record.problem_title && (
            <Tag color="orange">{record.problem_title}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.text}</Tag>,
    },
    {
      title: '点赞',
      dataIndex: 'like_count',
      key: 'like_count',
      width: 80,
    },
    {
      title: '浏览',
      dataIndex: 'views',
      key: 'views',
      width: 80,
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, record: Article) => (
        <Space>
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/articles/${record.id}`)}>
              查看
            </Button>
          )}
          {record.status !== 'approved' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/articles/${record.id}/edit`)}>
              编辑
            </Button>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>我的文章</Title>
        <Select
          placeholder="筛选状态"
          value={status}
          onChange={v => { setStatus(v); setPage(1) }}
          style={{ width: 140 }}
          allowClear
          options={[
            { label: '全部', value: undefined },
            { label: '审核中', value: 'pending' },
            { label: '已通过', value: 'approved' },
            { label: '未通过', value: 'rejected' },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={articles}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 15,
          onChange: setPage,
          showTotal: t => `共 ${t} 篇`,
        }}
        expandable={{
          expandedRowRender: (record: Article) =>
            record.status === 'rejected' && record.reject_reason ? (
              <div style={{ color: '#ff4d4f' }}>拒绝原因：{record.reject_reason}</div>
            ) : null,
          rowExpandable: (record: Article) => record.status === 'rejected' && !!record.reject_reason,
        }}
      />
    </div>
  )
}

export default MyArticles

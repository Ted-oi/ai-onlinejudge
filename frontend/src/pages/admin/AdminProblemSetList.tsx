import { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Popconfirm, message, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import problemSetService from '../../services/problemSet.service'
import { PROBLEM_SET_CATEGORIES } from '../../types/problemSet'
import type { ProblemSet } from '../../types'

const { Title } = Typography

const AdminProblemSetList = () => {
  const navigate = useNavigate()
  const [sets, setSets] = useState<ProblemSet[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSets = async () => {
    setLoading(true)
    try {
      const data = await problemSetService.getProblemSets({ limit: 100 })
      setSets(data.problemSets)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSets() }, [])

  const handleDelete = async (id: number) => {
    try {
      await problemSetService.deleteProblemSet(id)
      message.success('删除成功')
      fetchSets()
    } catch {
      message.error('删除失败')
    }
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
      render: (text: string, record: ProblemSet) => (
        <a onClick={() => navigate(`/admin/problem-sets/${record.id}/edit`)}>{text}</a>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (cat: string) => PROBLEM_SET_CATEGORIES.find(c => c.value === cat)?.label || cat,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      render: (diff: string) => {
        const config: Record<string, { color: string; label: string }> = {
          easy: { color: 'green', label: '简单' },
          medium: { color: 'orange', label: '中等' },
          hard: { color: 'red', label: '困难' },
          mixed: { color: 'blue', label: '混合' },
        }
        const d = config[diff] || config.mixed
        return <Tag color={d.color}>{d.label}</Tag>
      },
    },
    {
      title: '题目数',
      key: 'count',
      width: 80,
      render: (_: any, record: ProblemSet) => record.problem_count ?? (record.problem_ids?.length || 0),
    },
    {
      title: '状态',
      dataIndex: 'is_published',
      width: 80,
      render: (published: boolean) => (
        <Tag color={published ? 'green' : 'default'}>{published ? '已发布' : '草稿'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ProblemSet) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/admin/problem-sets/${record.id}/edit`)}
          />
          <Popconfirm title="确定删除该题单？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>题单管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/problem-sets/create')}>
          创建题单
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={sets}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 个题单` }}
      />
    </div>
  )
}

export default AdminProblemSetList

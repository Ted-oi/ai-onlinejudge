import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Tag, Popconfirm, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { problemService } from '../../services/problem.service'
import { PROBLEM_CATEGORIES } from '../../types/problem'
import type { Problem } from '../../types'

const { Search } = Input

const difficultyMap: Record<string, { color: string; label: string }> = {
  easy: { color: 'green', label: '简单' },
  medium: { color: 'orange', label: '中等' },
  hard: { color: 'red', label: '困难' },
}

const AdminProblemList = () => {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<string | undefined>()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    loadProblems()
  }, [pagination.current, pagination.pageSize, search, difficulty])

  const loadProblems = async () => {
    setLoading(true)
    try {
      const data = await problemService.getProblems({
        search: search || undefined,
        difficulty: difficulty || undefined,
        page: pagination.current,
        limit: pagination.pageSize,
      })
      setProblems(data || [])
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await problemService.deleteProblem(id)
      message.success('删除成功')
      loadProblems()
    } catch {
      // handled by interceptor
    }
  }

  const getCategoryName = (catId: string) => {
    const cat = PROBLEM_CATEGORIES.find(c => c.id === catId)
    return cat?.name || catId
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      sorter: (a: Problem, b: Problem) => a.id - b.id,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      render: (d: string) => {
        const info = difficultyMap[d]
        return <Tag color={info?.color}>{info?.label || d}</Tag>
      },
    },
    {
      title: '分类',
      dataIndex: 'categories',
      width: 200,
      render: (cats: string[] | string) => {
        const list = Array.isArray(cats) ? cats : cats ? [cats] : []
        return (
          <span>
            {list.map(c => (
              <Tag key={c} style={{ marginBottom: 2 }}>{getCategoryName(c)}</Tag>
            ))}
          </span>
        )
      },
    },
    {
      title: '时间限制',
      dataIndex: 'time_limit',
      width: 90,
      render: (v: number) => `${v}ms`,
    },
    {
      title: '内存限制',
      dataIndex: 'memory_limit',
      width: 90,
      render: (v: number) => `${v}MB`,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      width: 140,
      render: (_: any, record: Problem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/problems/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除此题目？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>题目管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/problems/create')}>
          创建题目
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Search
          placeholder="搜索题目标题"
          allowClear
          onSearch={setSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="难度筛选"
          allowClear
          style={{ width: 120 }}
          onChange={setDifficulty}
          options={[
            { label: '简单', value: 'easy' },
            { label: '中等', value: 'medium' },
            { label: '困难', value: 'hard' },
          ]}
        />
      </div>

      <Table
        dataSource={problems}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />
    </div>
  )
}

export default AdminProblemList

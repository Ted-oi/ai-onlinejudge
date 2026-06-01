import { useState, useEffect } from 'react'
import { Table, Select, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import { submissionService } from '../../services/submission.service'

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

const AdminSubmissionList = () => {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const navigate = useNavigate()

  useEffect(() => {
    loadSubmissions()
  }, [statusFilter])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const data = await submissionService.getSubmissions({
        status: statusFilter || undefined,
        limit: 100,
      })
      setSubmissions(data || [])
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      width: 80,
    },
    {
      title: '题目',
      dataIndex: 'problem_title',
      width: 160,
      render: (title: string, record: any) => title || `P${String(record.problem_id).padStart(4, '0')}`,
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
      title: '耗时',
      dataIndex: 'runtime',
      width: 80,
      render: (v: number) => v ? `${v}ms` : '-',
    },
    {
      title: '内存',
      dataIndex: 'memory',
      width: 80,
      render: (v: number) => v ? `${v}KB` : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: any) => (
        <a onClick={() => navigate(`/submissions/${record.id}`)}>查看</a>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>提交审查</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 150 }}
          onChange={setStatusFilter}
          options={Object.entries(statusLabels).map(([k, v]) => ({ label: v, value: k }))}
        />
      </div>

      <Table
        dataSource={submissions}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </div>
  )
}

export default AdminSubmissionList

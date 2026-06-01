import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Typography } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { submissionService } from '../../services/submission.service'

const { Title } = Typography

const SubmissionList = () => {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const data = await submissionService.getSubmissions()
      setSubmissions(data)
    } catch (error) {
      console.error('获取提交列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const statusConfig: any = {
    accepted: { color: 'success', text: '通过' },
    wrong_answer: { color: 'error', text: '答案错误' },
    time_limit_exceeded: { color: 'warning', text: '超时' },
    memory_limit_exceeded: { color: 'warning', text: '内存超限' },
    runtime_error: { color: 'error', text: '运行时错误' },
    compilation_error: { color: 'error', text: '编译错误' },
    pending: { color: 'processing', text: '评测中' },
    judging: { color: 'processing', text: '评测中' },
  }

  const columns = [
    {
      title: '提交ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '题目',
      dataIndex: 'problem_title',
      key: 'problem',
      width: 160,
      render: (title: string, record: any) => (
        <a onClick={() => navigate(`/problems/${record.problem_id}`)}>
          {title || `P${String(record.problem_id).padStart(4, '0')}`}
        </a>
      ),
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: '编程语言',
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language: string) => {
        const languages: any = {
          'cpp': 'C++',
          'java': 'Java',
          'python': 'Python',
          'c': 'C',
        }
        return languages[language] || language
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '运行时间',
      dataIndex: 'runtime',
      key: 'runtime',
      width: 100,
      render: (runtime: number) => runtime ? `${runtime}ms` : '-',
    },
    {
      title: '内存使用',
      dataIndex: 'memory',
      key: 'memory',
      width: 100,
      render: (memory: number) => memory ? `${memory}MB` : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/submissions/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>提交记录</Title>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={submissions}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条提交记录`,
          }}
        />
      </Card>
    </div>
  )
}

export default SubmissionList
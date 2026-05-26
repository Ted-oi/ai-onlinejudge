import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Tag, Typography, Space, message } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { submissionService } from '../../services/submission.service'

const { Title, Text } = Typography

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSubmission()
    }
  }, [id])

  const fetchSubmission = async () => {
    try {
      setLoading(true)
      const data = await submissionService.getSubmissionById(Number(id))
      setSubmission(data)
    } catch (error) {
      message.error('获取提交详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (!submission) {
    return <div>加载中...</div>
  }

  const statusConfig: any = {
    accepted: { color: 'success', icon: <CheckCircleOutlined />, text: '通过' },
    wrong_answer: { color: 'error', icon: <CloseCircleOutlined />, text: '答案错误' },
    time_limit_exceeded: { color: 'warning', text: '超时' },
    memory_limit_exceeded: { color: 'warning', text: '内存超限' },
    runtime_error: { color: 'error', text: '运行时错误' },
    compilation_error: { color: 'error', text: '编译错误' },
    pending: { color: 'processing', text: '评测中' },
    judging: { color: 'processing', text: '评测中' },
  }

  const config = statusConfig[submission.status] || { color: 'default', text: submission.status }

  const getLanguageName = (lang: string) => {
    const languages: any = {
      'cpp': 'C++',
      'java': 'Java',
      'python': 'Python',
      'c': 'C',
    }
    return languages[lang] || lang
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/problems')}
        >
          返回题目列表
        </Button>
      </Space>

      <Card loading={loading}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>提交详情 #{submission.id}</Title>
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="提交ID">{submission.id}</Descriptions.Item>
          <Descriptions.Item label="题目ID">{submission.problem_id}</Descriptions.Item>
          <Descriptions.Item label="用户ID">{submission.user_id}</Descriptions.Item>
          <Descriptions.Item label="编程语言">
            {getLanguageName(submission.language)}
          </Descriptions.Item>
          {submission.runtime && (
            <Descriptions.Item label="运行时间">
              {submission.runtime}ms
            </Descriptions.Item>
          )}
          {submission.memory && (
            <Descriptions.Item label="内存使用">
              {submission.memory}MB
            </Descriptions.Item>
          )}
          <Descriptions.Item label="提交时间">
            {new Date(submission.created_at).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        {submission.error_message && (
          <div style={{ marginTop: 24 }}>
            <Title level={4}>错误信息</Title>
            <Card>
              <Text type="danger">{submission.error_message}</Text>
            </Card>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Title level={4}>提交代码</Title>
          <ReactSyntaxHighlighter
            language={submission.language}
            style={docco}
            customStyle={{ maxHeight: '400px', overflow: 'auto' }}
          >
            {submission.code}
          </ReactSyntaxHighlighter>
        </div>

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button onClick={() => navigate(`/problems/${submission.problem_id}`)}>
              查看题目
            </Button>
            <Button onClick={() => navigate(`/problems/${submission.problem_id}/submit`)}>
              重新提交
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default SubmissionDetail
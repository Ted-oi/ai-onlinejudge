import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Tag, Typography, Space, message, Spin } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { submissionService } from '../../services/submission.service'
import ErrorExplanation from '../../components/problems/ErrorExplanation'

const { Title, Text } = Typography

const FINAL_STATUSES = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'system_error', 'error']

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSubmission = async () => {
    try {
      setLoading(true)
      const data = await submissionService.getSubmissionById(Number(id))
      setSubmission(data)

      // Stop polling if status is final
      if (FINAL_STATUSES.includes(data.status)) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    } catch (error) {
      message.error('获取提交详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchSubmission()
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [id])

  // Start polling when submission is in a non-final state
  useEffect(() => {
    if (submission && !FINAL_STATUSES.includes(submission.status) && !pollingRef.current) {
      pollingRef.current = setInterval(fetchSubmission, 1500)
    }
  }, [submission?.status])

  if (!submission) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载中..." /></div>
  }

  const statusConfig: any = {
    accepted: { color: 'success', icon: <CheckCircleOutlined />, text: '通过' },
    wrong_answer: { color: 'error', icon: <CloseCircleOutlined />, text: '答案错误' },
    time_limit_exceeded: { color: 'warning', text: '超时' },
    memory_limit_exceeded: { color: 'warning', text: '内存超限' },
    runtime_error: { color: 'error', text: '运行时错误' },
    compilation_error: { color: 'error', text: '编译错误' },
    system_error: { color: 'error', text: '系统错误' },
    error: { color: 'error', text: '错误' },
    pending: { color: 'processing', icon: <LoadingOutlined />, text: '等待评测' },
    judging: { color: 'processing', icon: <LoadingOutlined />, text: '评测中' },
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
          <Descriptions.Item label="题目">{submission.problem_title || `P${String(submission.problem_id).padStart(4, '0')}`}</Descriptions.Item>
          <Descriptions.Item label="用户ID">{submission.user_id}</Descriptions.Item>
          <Descriptions.Item label="编程语言">
            {getLanguageName(submission.language)}
          </Descriptions.Item>
          {submission.runtime != null && (
            <Descriptions.Item label="运行时间">
              {submission.runtime}ms
            </Descriptions.Item>
          )}
          {submission.memory != null && (
            <Descriptions.Item label="内存使用">
              {submission.memory}KB
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

        {submission.status !== 'accepted' && FINAL_STATUSES.includes(submission.status) && (
          <ErrorExplanation submissionId={submission.id} status={submission.status} />
        )}
      </Card>
    </div>
  )
}

export default SubmissionDetail

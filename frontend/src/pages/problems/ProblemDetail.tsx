import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Typography, Tag, Tabs, Space, message } from 'antd'
import { ArrowLeftOutlined, CodeOutlined } from '@ant-design/icons'
import { problemService } from '../../services/problem.service'
import type { Problem } from '../../types'
import ReactMarkdown from 'react-markdown'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'

const { Title } = Typography

const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProblem()
    }
  }, [id])

  const fetchProblem = async () => {
    try {
      setLoading(true)
      const data = await problemService.getProblemById(Number(id))
      setProblem(data)
    } catch (error) {
      message.error('获取题目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSolve = () => {
    navigate(`/problems/${id}/submit`)
  }

  if (!problem) {
    return <div>加载中...</div>
  }

  const difficultyColors: any = {
    easy: 'green',
    medium: 'blue',
    hard: 'red',
  }

  // 确保examples字段是有效的数组，并处理可能的格式问题
  const examples = Array.isArray(problem.examples)
    ? problem.examples.filter((example: any) => example && example.input && example.output)
    : []

  const exampleItems = examples.map((example: any, index: number) => ({
    key: index.toString(),
    label: `示例 ${index + 1}`,
    children: (
      <div>
        <div style={{ marginBottom: 8 }}>
          <strong>输入：</strong>
          <ReactSyntaxHighlighter
            language="plaintext"
            style={docco}
            customStyle={{ marginTop: 8 }}
          >
            {example.input}
          </ReactSyntaxHighlighter>
        </div>
        <div>
          <strong>输出：</strong>
          <ReactSyntaxHighlighter
            language="plaintext"
            style={docco}
            customStyle={{ marginTop: 8 }}
          >
            {example.output}
          </ReactSyntaxHighlighter>
        </div>
      </div>
    ),
  }))

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/problems')}
        >
          返回列表
        </Button>
        <Button
          type="primary"
          icon={<CodeOutlined />}
          onClick={handleSolve}
        >
          开始解题
        </Button>
      </Space>

      <Card loading={loading}>
        <div style={{ marginBottom: 16 }}>
          <Title level={2}>{problem.title}</Title>
          <Space>
            <Tag color={difficultyColors[problem.difficulty]}>
              {problem.difficulty}
            </Tag>
            <Tag color="blue">{problem.category}</Tag>
          </Space>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="时间限制">
            {problem.time_limit}ms
          </Descriptions.Item>
          <Descriptions.Item label="内存限制">
            {problem.memory_limit}MB
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <Title level={4}>题目描述</Title>
          <ReactMarkdown>{problem.description}</ReactMarkdown>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={4}>示例</Title>
          <Tabs items={exampleItems} />
        </div>
      </Card>
    </div>
  )
}

export default ProblemDetail
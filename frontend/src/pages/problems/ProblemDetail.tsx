import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Typography, Tag, Tabs, Space, message, Row, Col } from 'antd'
import { ArrowLeftOutlined, CodeOutlined, MessageOutlined } from '@ant-design/icons'
import { problemService } from '../../services/problem.service'
import type { Problem } from '../../types'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import TestCaseManager from './TestCaseManager'
import FavoriteButton from '../../components/problems/FavoriteButton'
import SmartHint from '../../components/problems/SmartHint'
import ProblemRecommendation from '../../components/problems/ProblemRecommendation'
import DiscussionList from '../discussions/DiscussionList'

const { Title } = Typography

const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canManage = user.role === 'admin' || user.role === 'teacher'

  useEffect(() => {
    if (id) fetchProblem()
  }, [id])

  const fetchProblem = async () => {
    try {
      setLoading(true)
      const data = await problemService.getProblemById(Number(id))
      setProblem(data)
    } catch {
      message.error('获取题目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSolve = () => navigate(`/problems/${id}/submit`)

  if (!problem) return <div>加载中...</div>

  const difficultyColors: any = { easy: 'green', medium: 'blue', hard: 'red' }
  const difficultyLabels: any = { easy: '简单', medium: '中等', hard: '困难' }

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
          <ReactSyntaxHighlighter language="plaintext" style={docco} customStyle={{ marginTop: 8 }}>
            {example.input}
          </ReactSyntaxHighlighter>
        </div>
        <div>
          <strong>输出：</strong>
          <ReactSyntaxHighlighter language="plaintext" style={docco} customStyle={{ marginTop: 8 }}>
            {example.output}
          </ReactSyntaxHighlighter>
        </div>
      </div>
    ),
  }))

  const mainTabItems = [
    {
      key: 'detail',
      label: '题目详情',
      children: (
        <>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="时间限制">{problem.time_limit}ms</Descriptions.Item>
            <Descriptions.Item label="内存限制">{problem.memory_limit}MB</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 24 }}>
            <Title level={4}>题目描述</Title>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{problem.description}</ReactMarkdown>
          </div>
          <div style={{ marginTop: 24 }}>
            <Title level={4}>示例</Title>
            <Tabs items={exampleItems} />
          </div>
          <div style={{ marginTop: 24 }}>
            <SmartHint problemId={problem.id} />
          </div>
        </>
      ),
    },
    {
      key: 'discussions',
      label: <span><MessageOutlined /> 讨论</span>,
      children: <DiscussionList />,
    },
    ...(canManage
      ? [{
          key: 'testcases',
          label: '测试数据',
          children: <TestCaseManager problemId={problem.id} />,
        }]
      : []),
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/problems')}>返回列表</Button>
        <Button type="primary" icon={<CodeOutlined />} onClick={handleSolve}>开始解题</Button>
        <FavoriteButton problemId={Number(id)} />
      </Space>

      <Row gutter={16}>
        <Col xs={24} lg={18}>
          <Card loading={loading}>
            <div style={{ marginBottom: 16 }}>
              <Title level={2}>P{(problem as any).problem_no ? String((problem as any).problem_no).padStart(4, '0') : problem.id} - {problem.title}</Title>
              <Space>
                <Tag color={difficultyColors[problem.difficulty]}>
                  {difficultyLabels[problem.difficulty] || problem.difficulty}
                </Tag>
                <Tag color="blue">{problem.category}</Tag>
              </Space>
            </div>
            <Tabs items={mainTabItems} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <ProblemRecommendation />
        </Col>
      </Row>
    </div>
  )
}

export default ProblemDetail

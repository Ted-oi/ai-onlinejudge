import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Typography, Tag, Tabs, Space, message, Row, Col } from 'antd'
import { ArrowLeftOutlined, CodeOutlined, MessageOutlined, FileTextOutlined } from '@ant-design/icons'
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
import ArticleList from '../articles/ArticleList'

const { Title, Text } = Typography

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

  // Objective question detail
  if (problem.problem_type === 'objective') {
    const od = problem.objective_data
    return (
      <div>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/problems')}>返回列表</Button>
          <Button type="primary" onClick={() => navigate(`/problems/${id}/answer`)}>开始答题</Button>
        </Space>
        <Row gutter={16}>
          <Col xs={24} lg={18}>
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Title level={2}>P{String((problem as any).problem_no || problem.id).padStart(4, '0')} - {problem.title}</Title>
                <Space>
                  <Tag color={{ easy: 'green', medium: 'blue', hard: 'red' }[problem.difficulty]}>
                    {{ easy: '简单', medium: '中等', hard: '困难' }[problem.difficulty]}
                  </Tag>
                  <Tag color="blue">{problem.category}</Tag>
                  {od && <Tag color={od.type === 'choice' ? 'purple' : 'cyan'}>{od.type === 'choice' ? '单选题' : '判断题'}</Tag>}
                </Space>
              </div>
              <div style={{ lineHeight: 1.8 }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{problem.description}</ReactMarkdown>
              </div>
              {od?.type === 'choice' && od.options && (
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>选项</Title>
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {od.options.map((opt, idx) => (
                      <Card key={idx} size="small" style={{ borderRadius: 8 }}>
                        <Text strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + idx)}.</Text>
                        <Text>{opt}</Text>
                      </Card>
                    ))}
                  </Space>
                </div>
              )}
              {od?.type === 'judge' && (
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>判断</Title>
                  <Space size={24}>
                    <Tag color="green" style={{ padding: '4px 16px', fontSize: 14 }}>正确 (T)</Tag>
                    <Tag color="red" style={{ padding: '4px 16px', fontSize: 14 }}>错误 (F)</Tag>
                  </Space>
                </div>
              )}
              {canManage && od?.answer !== undefined && (
                <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                  <Text strong>正确答案（仅管理员可见）：</Text>
                  <Text type="success" strong>
                    {od.type === 'choice' ? `${String.fromCharCode(65 + (od.answer as number))}. ${od.options?.[od.answer as number]}` : od.answer ? '正确' : '错误'}
                  </Text>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <ProblemRecommendation />
          </Col>
        </Row>
      </div>
    )
  }

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
    {
      key: 'solutions',
      label: <span><FileTextOutlined /> 题解</span>,
      children: <ArticleList type="solution" problemId={problem.id} />,
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

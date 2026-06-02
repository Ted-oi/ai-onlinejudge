import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Radio, Button, Typography, Space, Tag, Spin, Result } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { submissionService } from '../../services/submission.service'
import { problemService } from '../../services/problem.service'
import type { Problem } from '../../types'

const { Title, Text } = Typography

const ObjectiveSubmit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | number | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<'accepted' | 'wrong_answer' | null>(null)

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const data = await problemService.getProblemById(Number(id))
        if (!data.objective_data) {
          navigate(`/problems/${id}/submit`)
          return
        }
        setProblem(data)
      } catch {} finally { setLoading(false) }
    }
    fetchProblem()
  }, [id])

  const handleSubmit = async () => {
    if (selected === undefined) return
    setSubmitting(true)
    try {
      const res = await submissionService.createSubmission({
        problem_id: Number(id),
        language: 'answer',
        code: String(selected),
      })
      setResult(res.status as 'accepted' | 'wrong_answer')
    } catch {} finally { setSubmitting(false) }
  }

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />
  if (!problem || !problem.objective_data) return <div>题目不存在</div>

  const od = problem.objective_data

  if (result) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Result
          status={result === 'accepted' ? 'success' : 'error'}
          icon={result === 'accepted' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          title={result === 'accepted' ? '回答正确！' : '回答错误'}
          subTitle={result === 'wrong_answer' ? '再想想，你可以重新提交' : ''}
          extra={[
            <Button key="retry" onClick={() => { setResult(null); setSelected(undefined) }}>
              重新作答
            </Button>,
            <Button key="back" type="primary" onClick={() => navigate(`/problems/${id}`)}>
              返回题目
            </Button>,
          ]}
        />
      </div>
    )
  }

  const difficultyConfig: Record<string, { color: string; label: string }> = {
    easy: { color: '#10b981', label: '简单' },
    medium: { color: '#f59e0b', label: '中等' },
    hard: { color: '#ef4444', label: '困难' },
  }
  const dc = difficultyConfig[problem.difficulty]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/problems/${id}`)} style={{ marginBottom: 16 }}>
        返回题目
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 12 }}>
          <Tag color={od.type === 'choice' ? 'purple' : 'cyan'}>
            {od.type === 'choice' ? '单选题' : '判断题'}
          </Tag>
          {dc && <Tag color={dc.color}>{dc.label}</Tag>}
        </Space>
        <Title level={4}>{problem.title}</Title>
        <div style={{ lineHeight: 1.8, marginBottom: 24 }}>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {problem.description}
          </ReactMarkdown>
        </div>

        {/* Choice */}
        {od.type === 'choice' && od.options && (
          <Radio.Group
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {od.options.map((opt, idx) => (
                <Radio key={idx} value={idx} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Card
                    size="small"
                    style={{
                      flex: 1, cursor: 'pointer', transition: 'all 0.2s',
                      borderColor: selected === idx ? '#4f46e5' : undefined,
                      background: selected === idx ? '#eef2ff' : undefined,
                    }}
                    styles={{ body: { padding: '10px 16px' } }}
                  >
                    <Text strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + idx)}.</Text>
                    <Text>{opt}</Text>
                  </Card>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}

        {/* Judge */}
        {od.type === 'judge' && (
          <Radio.Group
            value={selected as string}
            onChange={e => setSelected(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space size={24} style={{ justifyContent: 'center', width: '100%', display: 'flex' }}>
              <Radio value="true">
                <Card size="small" style={{
                  padding: '12px 32px', cursor: 'pointer', textAlign: 'center',
                  borderColor: selected === 'true' ? '#10b981' : undefined,
                  background: selected === 'true' ? '#ecfdf5' : undefined,
                }}>
                  <Text strong style={{ fontSize: 16 }}>正确 (T)</Text>
                </Card>
              </Radio>
              <Radio value="false">
                <Card size="small" style={{
                  padding: '12px 32px', cursor: 'pointer', textAlign: 'center',
                  borderColor: selected === 'false' ? '#ef4444' : undefined,
                  background: selected === 'false' ? '#fef2f2' : undefined,
                }}>
                  <Text strong style={{ fontSize: 16 }}>错误 (F)</Text>
                </Card>
              </Radio>
            </Space>
          </Radio.Group>
        )}
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          disabled={selected === undefined}
          loading={submitting}
          onClick={handleSubmit}
          style={{ minWidth: 200, height: 44, borderRadius: 10 }}
        >
          提交答案
        </Button>
      </div>
    </div>
  )
}

export default ObjectiveSubmit

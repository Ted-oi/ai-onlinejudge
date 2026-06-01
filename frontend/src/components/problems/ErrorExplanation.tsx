import { useState } from 'react'
import { Card, Button, Typography, Spin, Space } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import { aiService } from '../../services/ai.service'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const { Text } = Typography

interface ErrorExplanationProps {
  submissionId: number
  status: string
}

const ErrorExplanation = ({ submissionId }: ErrorExplanationProps) => {
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchExplanation = async () => {
    setLoading(true)
    try {
      const data = await aiService.explainError(submissionId)
      setExplanation(data.explanation)
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title={<Space><BugOutlined /> AI 错误分析</Space>}
      size="small"
      style={{ marginTop: 16 }}
    >
      {!explanation && !loading && (
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <Text type="secondary">让 AI 帮你分析代码中可能存在的问题</Text>
          <Button type="primary" onClick={fetchExplanation}>
            分析错误原因
          </Button>
        </Space>
      )}
      {loading && <Spin style={{ display: 'block', margin: '16px auto' }} tip="AI 正在分析..." />}
      {explanation && (
        <div style={{ lineHeight: 1.8 }}>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{explanation}</ReactMarkdown>
        </div>
      )}
    </Card>
  )
}

export default ErrorExplanation

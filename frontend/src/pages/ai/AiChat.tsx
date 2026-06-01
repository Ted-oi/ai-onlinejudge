import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Typography, Space, Tabs, Select, message, Avatar, Spin } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined, PlusOutlined, CodeOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { aiService } from '../../services/ai.service'
import { problemService } from '../../services/problem.service'
import type { ChatMessage } from '../../services/ai.service'

const { Title, Text } = Typography
const { TextArea } = Input

interface Conversation {
  id: number
  user_id: number
  problem_id: number | null
  problem_title?: string
  created_at: string
  updated_at: string
}

const AiChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('chat')
  const [problems, setProblems] = useState<Array<{ id: number; title: string }>>([])
  const [selectedProblemId, setSelectedProblemId] = useState<number | undefined>()
  // Code analysis states
  const [analysisCode, setAnalysisCode] = useState('')
  const [analysisLanguage, setAnalysisLanguage] = useState('cpp')
  const [analysisDescription, setAnalysisDescription] = useState('')
  const [analysisResult, setAnalysisResult] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    fetchProblems()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.id) return
      const data = await aiService.getConversations(user.id)
      setConversations(data)
    } catch (error) {
      console.error('获取对话列表失败:', error)
    }
  }

  const fetchProblems = async () => {
    try {
      const data = await problemService.getProblems()
      setProblems(data.problems)
    } catch (error) {
      console.error('获取题目列表失败:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.id) {
      message.error('请先登录')
      return
    }

    const userMessage: ChatMessage = { role: 'user', content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    const msgText = inputMessage
    setInputMessage('')
    setSending(true)

    try {
      const data = await aiService.chat({
        user_id: user.id,
        problem_id: selectedProblemId,
        message: msgText,
        conversation_id: activeConversationId || undefined,
      })

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.message }
      setMessages(prev => [...prev, assistantMessage])

      if (!activeConversationId && data.conversation_id) {
        setActiveConversationId(data.conversation_id)
        fetchConversations()
      }
    } catch (error) {
      message.error('AI 回复失败，请检查 API 配置')
    } finally {
      setSending(false)
    }
  }

  const handleAnalyze = async () => {
    if (!analysisCode.trim()) {
      message.warning('请输入代码')
      return
    }
    setAnalyzing(true)
    try {
      const result = await aiService.analyzeCode({
        code: analysisCode,
        language: analysisLanguage,
        problem_description: analysisDescription,
      })
      setAnalysisResult(result)
    } catch (error) {
      message.error('代码分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
    setSelectedProblemId(undefined)
  }

  const tabItems = [
    {
      key: 'chat',
      label: (
        <span><RobotOutlined /> AI 对话</span>
      ),
    },
    {
      key: 'analysis',
      label: (
        <span><CodeOutlined /> 代码分析</span>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>
      {/* Left sidebar - conversations */}
      <Card
        style={{ width: 260, flexShrink: 0 }}
        title="对话列表"
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={handleNewConversation}>
            新对话
          </Button>
        }
        bodyStyle={{ padding: 0, overflowY: 'auto', height: 'calc(100% - 57px)' }}
      >
        {conversations.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Text type="secondary">暂无对话记录</Text>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id)
                setMessages([])
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: activeConversationId === conv.id ? '#f0f5ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RobotOutlined style={{ color: '#1677ff' }} />
                <Text ellipsis style={{ flex: 1 }}>
                  {conv.problem_title || '通用对话'}
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(conv.created_at).toLocaleDateString()}
              </Text>
            </div>
          ))
        )}
      </Card>

      {/* Right main area */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ padding: '0 16px' }}
        />

        {activeTab === 'chat' ? (
          <>
            {/* Problem selector */}
            <div style={{ padding: '0 16px 8px' }}>
              <Space>
                <Text type="secondary">关联题目:</Text>
                <Select
                  allowClear
                  placeholder="选择关联题目（可选）"
                  style={{ width: 300 }}
                  value={selectedProblemId}
                  onChange={setSelectedProblemId}
                  options={problems.map(p => ({ label: p.title, value: p.id }))}
                />
              </Space>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <RobotOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                  <Title level={4} type="secondary">向 AI 助手提问</Title>
                  <Text type="secondary">可以询问题目思路、算法分析、代码优化等问题</Text>
                </div>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  {msg.role === 'assistant' && (
                    <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a', marginRight: 8, flexShrink: 0 }} />
                  )}
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '10px 16px',
                      borderRadius: 12,
                      backgroundColor: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                      color: msg.role === 'user' ? '#fff' : '#333',
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <div style={{ lineHeight: 1.6 }}>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff', marginLeft: 8, flexShrink: 0 }} />
                  )}
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex', marginBottom: 16 }}>
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a', marginRight: 8 }} />
                  <Spin size="small" style={{ marginTop: 8 }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  size="large"
                  placeholder="输入您的问题..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onPressEnter={handleSendMessage}
                  disabled={sending}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={sending}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </>
        ) : (
          /* Code Analysis Tab */
          <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Space style={{ marginBottom: 12 }}>
                <Text>语言:</Text>
                <Select
                  value={analysisLanguage}
                  onChange={setAnalysisLanguage}
                  style={{ width: 120 }}
                  options={[
                    { label: 'C++', value: 'cpp' },
                    { label: 'Java', value: 'java' },
                    { label: 'Python', value: 'python' },
                    { label: 'C', value: 'c' },
                  ]}
                />
              </Space>
              <TextArea
                placeholder="在此粘贴您的代码..."
                value={analysisCode}
                onChange={(e) => setAnalysisCode(e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 14 }}
              />
              <TextArea
                placeholder="题目描述（可选）"
                value={analysisDescription}
                onChange={(e) => setAnalysisDescription(e.target.value)}
                style={{ marginTop: 12, height: 80 }}
              />
              <Button
                type="primary"
                icon={<CodeOutlined />}
                onClick={handleAnalyze}
                loading={analyzing}
                style={{ marginTop: 12, alignSelf: 'flex-end' }}
              >
                分析代码
              </Button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Card title="分析结果" style={{ height: '100%' }} bodyStyle={{ overflowY: 'auto' }}>
                {analysisResult ? (
                  <div style={{ lineHeight: 1.8 }}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{analysisResult}</ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <CodeOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                    <div><Text type="secondary">提交代码后将显示分析结果</Text></div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AiChat

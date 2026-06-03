import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Avatar, Space, Button, Input, Divider, Spin, Popconfirm, message } from 'antd'
import { ArrowLeftOutlined, UserOutlined, PushpinOutlined } from '@ant-design/icons'
import discussionService from '../../services/discussion.service'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

const DiscussionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [discussion, setDiscussion] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchData = async () => {
    try {
      const data = await discussionService.getDiscussion(Number(id))
      setDiscussion(data.discussion)
      setReplies(data.replies || [])
    } catch (error) { console.error(error) } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setSubmitting(true)
    try {
      const data = await discussionService.createReply(Number(id), { content: replyContent })
      setReplies(prev => [...prev, data.reply])
      setReplyContent('')
      message.success('回复成功')
    } catch (error) { console.error(error) } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    await discussionService.deleteDiscussion(Number(id))
    message.success('已删除')
    navigate(-1)
  }

  const handlePin = async () => {
    await discussionService.updateDiscussion(Number(id), { is_pinned: !discussion.is_pinned })
    setDiscussion((prev: any) => ({ ...prev, is_pinned: !prev.is_pinned }))
    message.success(discussion.is_pinned ? '已取消置顶' : '已置顶')
  }

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />
  if (!discussion) return <div>讨论不存在</div>

  const canModify = user.id === discussion.user_id || user.role === 'admin' || user.role === 'teacher'

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space>
            <Avatar icon={<UserOutlined />} src={discussion.avatar} />
            <div>
              <Text strong>{discussion.username}</Text>
              <div><Text type="secondary">{dayjs(discussion.created_at).format('YYYY-MM-DD HH:mm')}</Text></div>
            </div>
          </Space>
          {canModify && (
            <Space>
              {(user.role === 'admin' || user.role === 'teacher') && (
                <Button size="small" onClick={handlePin}>
                  {discussion.is_pinned ? '取消置顶' : <><PushpinOutlined /> 置顶</>}
                </Button>
              )}
              <Popconfirm title="确认删除？" onConfirm={handleDelete}>
                <Button size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          )}
        </div>

        <Title level={4} style={{ marginTop: 16 }}>
          {discussion.is_pinned && <PushpinOutlined style={{ color: '#faad14', marginRight: 8 }} />}
          {discussion.title}
        </Title>

        <div style={{ lineHeight: 1.8 }}>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{discussion.content}</ReactMarkdown>
        </div>
      </Card>

      <Divider>回复 ({replies.length})</Divider>

      {replies.map((reply: any) => (
        <Card key={reply.id} size="small" style={{ marginBottom: 8 }}>
          <Space style={{ marginBottom: 8 }}>
            <Avatar size="small" icon={<UserOutlined />} src={reply.avatar} />
            <Text strong>{reply.username}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(reply.created_at).format('MM-DD HH:mm')}</Text>
          </Space>
          <div style={{ lineHeight: 1.8 }}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{reply.content}</ReactMarkdown>
          </div>
        </Card>
      ))}

      <Card size="small" style={{ marginTop: 16 }}>
        <TextArea
          rows={3}
          value={replyContent}
          onChange={e => setReplyContent(e.target.value)}
          placeholder="写下你的回复（支持 Markdown）"
        />
        <Button
          type="primary"
          onClick={handleReply}
          loading={submitting}
          style={{ marginTop: 8 }}
          disabled={!replyContent.trim()}
        >
          回复
        </Button>
      </Card>
    </div>
  )
}

export default DiscussionDetail

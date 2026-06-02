import { useState, useEffect } from 'react'
import { Card, Button, Typography, Tag, Space, Spin, message, Avatar, Input, Popconfirm } from 'antd'
import { ArrowLeftOutlined, HeartOutlined, HeartFilled, PushpinOutlined, PushpinFilled, CopyOutlined, UserOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import codeShareService from '../../services/codeShare.service'
import type { SharedCode, SharedCodeComment } from '../../types/codeShare'

const { Text, Paragraph } = Typography

const CodeShareDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [code, setCode] = useState<SharedCode | null>(null)
  const [comments, setComments] = useState<SharedCodeComment[]>([])
  const [loading, setLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (id) { fetchCode(); fetchComments() }
  }, [id])

  const fetchCode = async () => {
    try {
      setLoading(true)
      const data = await codeShareService.getSharedCodeById(Number(id))
      setCode(data.code)
    } catch { message.error('获取代码失败') }
    finally { setLoading(false) }
  }

  const fetchComments = async () => {
    try {
      const data = await codeShareService.getComments(Number(id))
      setComments(data.comments)
    } catch {}
  }

  const handleLike = async () => {
    if (!code) return
    try {
      const data = await codeShareService.toggleLike(code.id)
      setCode({ ...code, isLiked: data.liked, like_count: data.like_count })
    } catch { message.error('操作失败') }
  }

  const handlePin = async () => {
    if (!code) return
    try {
      const data = await codeShareService.togglePin(code.id)
      setCode({ ...code, isPinned: data.pinned, pin_count: data.pin_count })
    } catch { message.error('操作失败') }
  }

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code.code)
      message.success('代码已复制')
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    try {
      const data = await codeShareService.createComment(Number(id), { content: commentText, parent_id: replyTo || undefined })
      setComments(prev => {
        if (replyTo) {
          return prev.map(c => c.id === replyTo ? { ...c, replies: [...(c.replies || []), data.comment] } : c)
        }
        return [...prev, data.comment]
      })
      setCommentText('')
      setReplyTo(null)
    } catch { message.error('评论失败') }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await codeShareService.deleteComment(Number(id), commentId)
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
        ...c, replies: c.replies?.filter(r => r.id !== commentId)
      })))
      message.success('已删除')
    } catch { message.error('删除失败') }
  }

  if (loading) return <Spin style={{ display: 'block', margin: '60px auto' }} />
  if (!code) return <div>代码不存在</div>

  const renderComment = (comment: SharedCodeComment, depth = 0) => (
    <div key={comment.id} style={{ marginLeft: depth * 24, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Avatar size="small" icon={<UserOutlined />} src={comment.avatar} />
        <div style={{ flex: 1 }}>
          <div><Text strong>{comment.username}</Text> <Text type="secondary" style={{ fontSize: 12 }}>{new Date(comment.created_at).toLocaleString()}</Text></div>
          <div style={{ margin: '4px 0' }}>{comment.content}</div>
          <Space size={8}>
            <Button type="link" size="small" onClick={() => { setReplyTo(comment.id); setCommentText(`@${comment.username} `) }}>回复</Button>
            {(comment.user_id === currentUser.id || currentUser.role === 'admin') && (
              <Popconfirm title="确定删除？" onConfirm={() => handleDeleteComment(comment.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        </div>
      </div>
      {comment.replies?.map(r => renderComment(r, depth + 1))}
    </div>
  )

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0' }}>{code.title}</h2>
            <Space wrap>
              <Tag color="blue">{code.language}</Tag>
              {code.problem_title && (
                <Tag color="purple" style={{ cursor: 'pointer' }} onClick={() => navigate(`/problems/${code.problem_id}`)}>
                  #{code.problem_id} {code.problem_title}
                </Tag>
              )}
              {code.tags?.map((t, i) => <Tag key={i}>{t}</Tag>)}
            </Space>
          </div>
          <Space>
            <Button icon={code.isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />} onClick={handleLike}>{code.like_count}</Button>
            <Button icon={code.isPinned ? <PushpinFilled style={{ color: '#4f46e5' }} /> : <PushpinOutlined />} onClick={handlePin}>{code.pin_count}</Button>
          </Space>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Avatar icon={<UserOutlined />} src={code.author_avatar} />
          <Text strong>{code.author_name}</Text>
          <Text type="secondary">{new Date(code.created_at).toLocaleString()}</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>浏览 {code.views}</Text>
        </div>

        {code.description && <Paragraph style={{ marginBottom: 16 }}>{code.description}</Paragraph>}

        <div style={{ position: 'relative' }}>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>复制</Button>
          <pre style={{
            background: '#1e1e2e', color: '#cdd6f4', borderRadius: 8,
            padding: 16, overflow: 'auto', maxHeight: 500,
            fontSize: 13, lineHeight: 1.6, margin: 0,
          }}>
            <code>{code.code}</code>
          </pre>
        </div>
      </Card>

      {/* Comments */}
      <Card title={`评论 (${comments.length})`} style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Input value={commentText} onChange={e => setCommentText(e.target.value)}
            placeholder={replyTo ? '回复...' : '写下评论...'}
            onPressEnter={handleComment} />
          <Button icon={<SendOutlined />} type="primary" onClick={handleComment}>发送</Button>
          {replyTo && <Button onClick={() => { setReplyTo(null); setCommentText('') }}>取消</Button>}
        </div>
        {comments.map(c => renderComment(c))}
      </Card>
    </div>
  )
}

export default CodeShareDetail

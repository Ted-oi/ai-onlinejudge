import { useState, useEffect } from 'react'
import { Typography, Avatar, Input, Button, Space, Card, Popconfirm, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import dayjs from 'dayjs'
import articleService from '../../services/article.service'
import type { ArticleComment } from '../../types/article'

const { Text } = Typography
const { TextArea } = Input

const CommentItem = ({ comment, articleId, onRefresh, depth = 0 }: {
  comment: ArticleComment
  articleId: number
  onRefresh: () => void
  depth?: number
}) => {
  const [replying, setReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canModify = user.id === comment.user_id || user.role === 'admin' || user.role === 'teacher'

  const handleReply = async () => {
    if (!replyContent.trim()) return
    await articleService.createComment(articleId, { content: replyContent, parent_id: comment.id })
    setReplyContent('')
    setReplying(false)
    onRefresh()
    message.success('回复成功')
  }

  const handleDelete = async () => {
    await articleService.deleteComment(articleId, comment.id)
    onRefresh()
    message.success('已删除')
  }

  return (
    <div style={{ marginLeft: depth * 32, marginBottom: 8 }}>
      <Card size="small" style={{ background: depth > 0 ? '#fafafa' : undefined }}>
        <Space style={{ marginBottom: 8 }}>
          <Avatar size={20} icon={<UserOutlined />} src={comment.avatar} />
          <Text strong>{comment.username}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(comment.created_at).format('MM-DD HH:mm')}
          </Text>
        </Space>
        <div style={{ lineHeight: 1.8 }}>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {comment.content}
          </ReactMarkdown>
        </div>
        <Space style={{ marginTop: 4 }}>
          <Button type="link" size="small" onClick={() => setReplying(!replying)}>回复</Button>
          {canModify && (
            <Popconfirm title="确认删除？" onConfirm={handleDelete}>
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
        {replying && (
          <div style={{ marginTop: 8 }}>
            <TextArea rows={2} value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="回复..." />
            <Space style={{ marginTop: 4 }}>
              <Button size="small" type="primary" onClick={handleReply}>提交</Button>
              <Button size="small" onClick={() => setReplying(false)}>取消</Button>
            </Space>
          </div>
        )}
      </Card>
      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} articleId={articleId} onRefresh={onRefresh} depth={depth + 1} />
      ))}
    </div>
  )
}

const CommentSection = ({ articleId }: { articleId: number }) => {
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = async () => {
    try {
      const data = await articleService.getComments(articleId)
      setComments(data.comments || [])
    } catch (error) { console.error(error) }
  }

  useEffect(() => { fetchComments() }, [articleId])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await articleService.createComment(articleId, { content })
      setContent('')
      fetchComments()
      message.success('评论成功')
    } catch (error) { console.error(error) } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <TextArea rows={3} value={content} onChange={e => setContent(e.target.value)} placeholder="写下你的评论（支持 Markdown）" />
        <Button type="primary" onClick={handleSubmit} loading={submitting} style={{ marginTop: 8 }} disabled={!content.trim()}>
          发表评论
        </Button>
      </Card>
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} articleId={articleId} onRefresh={fetchComments} />
      ))}
      {comments.length === 0 && <Text type="secondary">暂无评论</Text>}
    </div>
  )
}

export default CommentSection

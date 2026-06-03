import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Avatar, Space, Button, Tag, Divider, Spin, Popconfirm, message } from 'antd'
import { ArrowLeftOutlined, UserOutlined, HeartOutlined, HeartFilled, StarOutlined, StarFilled, EditOutlined, DeleteOutlined, EyeOutlined, MessageOutlined, BookOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import dayjs from 'dayjs'
import articleService from '../../services/article.service'
import CommentSection from '../../components/articles/CommentSection'
import type { Article } from '../../types/article'

const { Title, Text } = Typography

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchArticle = async () => {
    try {
      const data = await articleService.getArticleById(Number(id))
      setArticle(data.article)
    } catch {
      message.error('文章不存在或无权访问')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticle() }, [id])

  const handleLike = async () => {
    if (!article) return
    try {
      const data = await articleService.toggleLike(article.id)
      setArticle(prev => prev ? { ...prev, isLiked: data.liked, like_count: data.like_count } : prev)
    } catch (error) { console.error(error) }
  }

  const handleFavorite = async () => {
    if (!article) return
    try {
      const data = await articleService.toggleFavorite(article.id)
      setArticle(prev => prev ? { ...prev, isFavorited: data.favorited, favorite_count: data.favorite_count } : prev)
    } catch (error) { console.error(error) }
  }

  const handleDelete = async () => {
    if (!article) return
    await articleService.deleteArticle(article.id)
    message.success('已删除')
    navigate('/articles')
  }

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />
  if (!article) return <div>文章不存在</div>

  const canModify = user.id === article.author_id || user.role === 'admin' || user.role === 'teacher'

  const statusConfig: Record<string, { color: string; text: string }> = {
    pending: { color: 'gold', text: '审核中' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '未通过' },
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space align="center">
            <Avatar size={40} icon={<UserOutlined />} src={article.author_avatar} />
            <div>
              <Text strong>{article.author_name}</Text>
              <div><Text type="secondary">{dayjs(article.created_at).format('YYYY-MM-DD HH:mm')}</Text></div>
            </div>
          </Space>
          <Space>
            <Tag color={article.type === 'solution' ? 'green' : 'blue'}>
              {article.type === 'solution' ? '题解' : '博客'}
            </Tag>
            <Tag color={statusConfig[article.status]?.color}>
              {statusConfig[article.status]?.text}
            </Tag>
          </Space>
        </div>

        <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>{article.title}</Title>

        <Space wrap style={{ marginBottom: 12 }}>
          {article.tags?.map((tag, i) => <Tag key={i}>{tag}</Tag>)}
          {article.problem_title && (
            <Tag color="orange" style={{ cursor: 'pointer' }} onClick={() => navigate(`/problems/${article.problem_id}`)}>
              <BookOutlined /> {article.problem_title}
            </Tag>
          )}
        </Space>

        {article.status === 'rejected' && article.reject_reason && (
          <Card size="small" style={{ background: '#fff2f0', marginBottom: 16, borderColor: '#ffccc7' }}>
            <Text type="danger">拒绝原因：{article.reject_reason}</Text>
          </Card>
        )}

        <div style={{ lineHeight: 1.8, fontSize: 15 }}>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {article.content}
          </ReactMarkdown>
        </div>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16}>
            <Button
              type={article.isLiked ? 'primary' : 'default'}
              danger={article.isLiked}
              icon={article.isLiked ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleLike}
            >
              {article.like_count}
            </Button>
            <Button
              icon={article.isFavorited ? <StarFilled /> : <StarOutlined />}
              onClick={handleFavorite}
              style={article.isFavorited ? { color: '#faad14', borderColor: '#faad14' } : undefined}
            >
              收藏 {article.favorite_count > 0 ? article.favorite_count : ''}
            </Button>
            <Text type="secondary"><EyeOutlined /> {article.views} 次浏览</Text>
          </Space>
          {canModify && (
            <Space>
              {article.status !== 'approved' && (
                <Button icon={<EditOutlined />} onClick={() => navigate(`/articles/${article.id}/edit`)}>
                  编辑
                </Button>
              )}
              <Popconfirm title="确认删除？" onConfirm={handleDelete}>
                <Button danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </Space>
          )}
        </div>
      </Card>

      <Divider><MessageOutlined /> 评论</Divider>
      <CommentSection articleId={Number(id)} />
    </div>
  )
}

export default ArticleDetail

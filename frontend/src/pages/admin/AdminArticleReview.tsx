import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Modal, Card, Typography, Input, Radio, message, Avatar } from 'antd'
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import dayjs from 'dayjs'
import articleService from '../../services/article.service'
import type { Article } from '../../types/article'

const { Text, Title } = Typography
const { TextArea } = Input

const AdminArticleReview = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState<Article | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const data = await articleService.getPendingArticles({ page, limit: 15 })
      setArticles(data.articles || [])
      setTotal(data.total || 0)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [page])

  const handleReview = async () => {
    if (!reviewModal) return
    setSubmitting(true)
    try {
      await articleService.reviewArticle(reviewModal.id, {
        status: reviewStatus,
        reject_reason: reviewStatus === 'rejected' ? rejectReason : undefined,
      })
      message.success(reviewStatus === 'approved' ? '已通过' : '已拒绝')
      setReviewModal(null)
      setRejectReason('')
      fetchPending()
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Article) => (
        <Space>
          <Tag color={record.type === 'solution' ? 'green' : 'blue'}>
            {record.type === 'solution' ? '题解' : '博客'}
          </Tag>
          <span>{text}</span>
          {record.problem_title && <Tag color="orange">{record.problem_title}</Tag>}
        </Space>
      ),
    },
    {
      title: '作者',
      key: 'author',
      width: 120,
      render: (_: any, record: Article) => (
        <Space>
          <Avatar size={20} icon={<UserOutlined />} src={record.author_avatar} />
          <Text>{record.author_name}</Text>
        </Space>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: Article) => (
        <Button type="primary" size="small" onClick={() => { setReviewModal(record); setReviewStatus('approved'); setRejectReason('') }}>
          审核
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4}>文章审核</Title>
      <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
        待审核文章 {total} 篇
      </Text>

      <Table
        columns={columns}
        dataSource={articles}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 15,
          onChange: setPage,
          showTotal: t => `共 ${t} 篇`,
        }}
      />

      <Modal
        title="审核文章"
        open={!!reviewModal}
        onCancel={() => setReviewModal(null)}
        width={800}
        footer={null}
      >
        {reviewModal && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space>
                <Tag color={reviewModal.type === 'solution' ? 'green' : 'blue'}>
                  {reviewModal.type === 'solution' ? '题解' : '博客'}
                </Tag>
                <Text strong>{reviewModal.title}</Text>
                {reviewModal.problem_title && <Tag color="orange">题目: {reviewModal.problem_title}</Tag>}
              </Space>
              {reviewModal.summary && (
                <div style={{ marginTop: 8, color: '#666' }}>{reviewModal.summary}</div>
              )}
              {reviewModal.tags?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {reviewModal.tags.map((t, i) => <Tag key={i}>{t}</Tag>)}
                </div>
              )}
            </Card>

            <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 6, padding: 16, marginBottom: 16, lineHeight: 1.8 }}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {reviewModal.content}
              </ReactMarkdown>
            </div>

            <Radio.Group value={reviewStatus} onChange={e => setReviewStatus(e.target.value)} style={{ marginBottom: 12 }}>
              <Radio.Button value="approved"><CheckOutlined /> 通过</Radio.Button>
              <Radio.Button value="rejected"><CloseOutlined /> 拒绝</Radio.Button>
            </Radio.Group>

            {reviewStatus === 'rejected' && (
              <TextArea
                rows={3}
                placeholder="请填写拒绝原因"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{ marginBottom: 12 }}
              />
            )}

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setReviewModal(null)}>取消</Button>
                <Button
                  type="primary"
                  danger={reviewStatus === 'rejected'}
                  onClick={handleReview}
                  loading={submitting}
                  disabled={reviewStatus === 'rejected' && !rejectReason.trim()}
                >
                  {reviewStatus === 'approved' ? '通过' : '拒绝'}
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminArticleReview

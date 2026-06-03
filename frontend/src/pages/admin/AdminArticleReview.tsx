import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Modal, Card, Typography, Input, Radio, Tabs, Popconfirm, message, Avatar } from 'antd'
import { CheckOutlined, CloseOutlined, UserOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import dayjs from 'dayjs'
import articleService from '../../services/article.service'
import type { Article } from '../../types/article'

const { Text, Title } = Typography
const { TextArea } = Input

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'gold', label: '待审核' },
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已拒绝' },
}

const AdminArticleReview = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState<string>('pending')
  const [reviewModal, setReviewModal] = useState<Article | null>(null)
  const [previewModal, setPreviewModal] = useState<Article | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      let data: any
      if (statusTab === 'pending') {
        data = await articleService.getPendingArticles({ page, limit: 15 })
      } else {
        data = await articleService.getArticles({ status: statusTab, page, limit: 15 })
      }
      setArticles(data.articles || [])
      setTotal(data.total || 0)
    } catch (error) { console.error(error) } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [statusTab])

  useEffect(() => { fetchArticles() }, [page, statusTab])

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
      fetchArticles()
    } catch (error) { console.error(error) } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await articleService.deleteArticle(id)
      message.success('删除成功')
      fetchArticles()
    } catch (error) { console.error(error) }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Article) => (
        <Space>
          <Tag color={record.type === 'solution' ? 'green' : 'blue'}>
            {record.type === 'solution' ? '题解' : '博客'}
          </Tag>
          <span>{text}</span>
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => {
        const cfg = statusConfig[s]
        return <Tag color={cfg?.color}>{cfg?.label || s}</Tag>
      },
    },
    {
      title: '点赞/评论',
      key: 'engagement',
      width: 100,
      render: (_: any, record: Article) => (
        <span>{record.like_count || 0} / {record.comment_count || 0}</span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Article) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setPreviewModal(record)}>
            预览
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => { setReviewModal(record); setReviewStatus('approved'); setRejectReason('') }}>
              审核
            </Button>
          )}
          <Popconfirm title="确定删除此文章？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4}>文章管理</Title>

      <Tabs
        activeKey={statusTab}
        onChange={setStatusTab}
        style={{ marginBottom: 16 }}
        items={[
          { key: 'pending', label: '待审核' },
          { key: 'approved', label: '已通过' },
          { key: 'rejected', label: '已拒绝' },
        ]}
      />

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

      {/* Preview Modal */}
      <Modal
        title={previewModal?.title}
        open={!!previewModal}
        onCancel={() => setPreviewModal(null)}
        width={800}
        footer={<Button onClick={() => setPreviewModal(null)}>关闭</Button>}
      >
        {previewModal && (
          <div>
            <Space style={{ marginBottom: 12 }} wrap>
              <Tag color={previewModal.type === 'solution' ? 'green' : 'blue'}>
                {previewModal.type === 'solution' ? '题解' : '博客'}
              </Tag>
              <Tag color={statusConfig[previewModal.status]?.color}>
                {statusConfig[previewModal.status]?.label}
              </Tag>
              {previewModal.tags?.map((t, i) => <Tag key={i}>{t}</Tag>)}
            </Space>
            <div style={{ maxHeight: 500, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 6, padding: 16, lineHeight: 1.8 }}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {previewModal.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
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
              </Space>
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

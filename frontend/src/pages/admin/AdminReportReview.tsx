import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Form, Input, Select, message, Typography, Space, Drawer, Descriptions } from 'antd'
import { FlagOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import problemReportService, { ReportCategory, ReportSeverity, ReportStatus, ProblemReport } from '../../services/problemReport.service'
import { useTheme } from '../../components/common/ThemeSwitcher'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Title, Text, Paragraph } = Typography

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  description: '题面描述', testdata: '测试数据', solution: '标程/答案', spj: 'Special Judge', other: '其它',
}
const SEVERITY_LABELS: Record<ReportSeverity, string> = {
  low: '轻微', normal: '一般', high: '严重', critical: '致命',
}
const SEVERITY_COLOR: Record<ReportSeverity, string> = {
  low: 'default', normal: 'blue', high: 'orange', critical: 'red',
}
const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '待处理', reviewing: '处理中', resolved: '已解决', rejected: '已驳回',
}
const STATUS_COLOR: Record<ReportStatus, string> = {
  pending: 'default', reviewing: 'processing', resolved: 'success', rejected: 'error',
}

const AdminReportReview = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e'

  const [reports, setReports] = useState<ProblemReport[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>()
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | undefined>()
  const [active, setActive] = useState<ProblemReport | null>(null)
  const [reviewForm] = Form.useForm()
  const [reviewing, setReviewing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await problemReportService.list({
        status: statusFilter,
        category: categoryFilter,
        page,
        limit: 20,
      })
      setReports(r.reports || [])
      setTotal(r.total)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter, categoryFilter])

  const handleReview = async (status: 'reviewing' | 'resolved' | 'rejected') => {
    if (!active) return
    try {
      const v = await reviewForm.validateFields()
      setReviewing(true)
      const res = await problemReportService.review(active.id, {
        status,
        admin_comment: v.admin_comment,
      })
      message.success(res.message || '已更新')
      setActive(null)
      reviewForm.resetFields()
      load()
    } catch (e: any) {
      if (e?.errorFields) return
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div>
      <Card
        style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}
        title={<Space><FlagOutlined style={{ color: '#fa541c' }} /><span style={{ color: textColor }}>题目纠错反馈审核</span></Space>}
        extra={
          <Space>
            <Select
              allowClear
              placeholder="按状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1) }}
              options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Select
              allowClear
              placeholder="按类别"
              style={{ width: 140 }}
              value={categoryFilter}
              onChange={(v) => { setCategoryFilter(v); setPage(1) }}
              options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={reports}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showSizeChanger: false }}
          columns={[
            { title: '#', dataIndex: 'id', width: 60 },
            {
              title: '题目',
              dataIndex: 'problem_title',
              ellipsis: true,
              render: (v, r: any) => (
                <a onClick={() => navigate(`/problems/${r.problem_id}`)}>#{r.problem_id} {v || ''}</a>
              ),
            },
            {
              title: '反馈人',
              dataIndex: 'reporter_name',
              width: 110,
              render: (v, r: any) => v ? <a onClick={() => navigate(`/users/${r.user_id}`)}>{v}</a> : '-',
            },
            {
              title: '类别',
              dataIndex: 'category',
              width: 100,
              render: (v: ReportCategory) => <Tag>{CATEGORY_LABELS[v]}</Tag>,
            },
            {
              title: '严重',
              dataIndex: 'severity',
              width: 80,
              render: (v: ReportSeverity) => <Tag color={SEVERITY_COLOR[v]}>{SEVERITY_LABELS[v]}</Tag>,
            },
            {
              title: '标题',
              dataIndex: 'title',
              ellipsis: true,
              render: (v) => <Text style={{ color: textColor }}>{v}</Text>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (v: ReportStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABELS[v]}</Tag>,
            },
            {
              title: '时间',
              dataIndex: 'created_at',
              width: 120,
              render: (v) => <Text type="secondary">{dayjs(v).fromNow()}</Text>,
            },
            {
              title: '操作',
              width: 80,
              render: (_, r) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => { setActive(r); reviewForm.resetFields() }}>
                  处理
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={active ? `反馈 #${active.id}` : ''}
        open={!!active}
        onClose={() => setActive(null)}
        width={560}
        footer={active && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button loading={reviewing} onClick={() => handleReview('reviewing')}>标记处理中</Button>
            <Button danger loading={reviewing} onClick={() => handleReview('rejected')}>驳回</Button>
            <Button type="primary" loading={reviewing} onClick={() => handleReview('resolved')}>标记已解决</Button>
          </div>
        )}
      >
        {active && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="题目">
                #{active.problem_id} {active.problem_title}
              </Descriptions.Item>
              <Descriptions.Item label="反馈人">
                {active.reporter_name || `用户#${active.user_id}`}
              </Descriptions.Item>
              <Descriptions.Item label="类别">
                <Tag>{CATEGORY_LABELS[active.category]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={SEVERITY_COLOR[active.severity]}>{SEVERITY_LABELS[active.severity]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLOR[active.status]}>{STATUS_LABELS[active.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {dayjs(active.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {active.reviewed_at && (
                <Descriptions.Item label="处理时间">
                  {dayjs(active.reviewed_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ marginTop: 16, color: textColor }}>{active.title}</Title>
            <Paragraph style={{ background: isDark ? '#2a2a2a' : '#fafafa', padding: 12, borderRadius: 6, whiteSpace: 'pre-wrap' }}>
              {active.content}
            </Paragraph>

            {active.admin_comment && (
              <>
                <Text type="secondary">当前处理意见：</Text>
                <Paragraph style={{ background: isDark ? '#2a2a2a' : '#fafafa', padding: 12, borderRadius: 6 }}>
                  {active.admin_comment}
                </Paragraph>
              </>
            )}

            <Title level={5} style={{ marginTop: 16, color: textColor }}>处理意见</Title>
            <Form form={reviewForm} layout="vertical">
              <Form.Item name="admin_comment">
                <Input.TextArea
                  placeholder="填写处理意见，将通知反馈人"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default AdminReportReview

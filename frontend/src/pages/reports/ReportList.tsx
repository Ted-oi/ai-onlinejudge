import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, message, Typography, Space, Empty, Tooltip } from 'antd'
import { FlagOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import problemReportService, { ReportCategory, ReportSeverity, ReportStatus, ProblemReport } from '../../services/problemReport.service'
import { useTheme } from '../../components/common/ThemeSwitcher'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text } = Typography

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  description: '题面描述',
  testdata: '测试数据',
  solution: '标程/答案',
  spj: 'Special Judge',
  other: '其它',
}

const SEVERITY_LABELS: Record<ReportSeverity, string> = {
  low: '轻微',
  normal: '一般',
  high: '严重',
  critical: '致命',
}

const SEVERITY_COLOR: Record<ReportSeverity, string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  critical: 'red',
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '待处理',
  reviewing: '处理中',
  resolved: '已解决',
  rejected: '已驳回',
}

const STATUS_COLOR: Record<ReportStatus, string> = {
  pending: 'default',
  reviewing: 'processing',
  resolved: 'success',
  rejected: 'error',
}

interface Props {
  // 仅查看某个题目的反馈；不传则查看我的全部
  problemId?: number
  problemTitle?: string
  showOnlyProblem?: boolean
}

export const ReportModal = ({
  open, problemId, problemTitle, onClose, onSubmitted,
}: {
  open: boolean
  problemId?: number
  problemTitle?: string
  onClose: () => void
  onSubmitted?: () => void
}) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleOk = async () => {
    try {
      const v = await form.validateFields()
      if (!problemId) {
        message.error('未指定题目')
        return
      }
      setSubmitting(true)
      const res = await problemReportService.create({
        problem_id: problemId,
        category: v.category,
        severity: v.severity || 'normal',
        title: v.title,
        content: v.content,
      })
      message.success(res.message || '已提交，感谢您的反馈')
      form.resetFields()
      onClose()
      onSubmitted?.()
    } catch (e: any) {
      if (e?.errorFields) return // 表单校验错误
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="提交题目纠错反馈"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={submitting}
      okText="提交反馈"
      cancelText="取消"
      width={560}
    >
      {problemTitle && (
        <div style={{ marginBottom: 12, padding: 12, background: '#fafafa', borderRadius: 6 }}>
          <Text type="secondary">反馈题目：</Text>
          <Text strong>#{problemId} {problemTitle}</Text>
        </div>
      )}
      <Form form={form} layout="vertical" initialValues={{ severity: 'normal', category: 'description' }}>
        <Form.Item name="category" label="问题类别" rules={[{ required: true }]}>
          <Select
            options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </Form.Item>
        <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
          <Select
            options={Object.entries(SEVERITY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </Form.Item>
        <Form.Item name="title" label="标题" rules={[{ required: true, min: 5, max: 200 }]}>
          <Input placeholder="一句话描述问题，例如：样例输出与期望不符" />
        </Form.Item>
        <Form.Item name="content" label="详细说明" rules={[{ required: true, min: 10 }]}>
          <Input.TextArea
            placeholder="请说明：重现步骤、期望结果、实际结果、相关截图链接（如有）"
            autoSize={{ minRows: 4, maxRows: 10 }}
            showCount
            maxLength={2000}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const ReportList = ({ problemId, problemTitle, showOnlyProblem }: Props) => {
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
  const [modalOpen, setModalOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await problemReportService.getMy({
        status: statusFilter,
        page,
        limit: 15,
      })
      setReports(r.reports || [])
      setTotal(r.total)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter])

  return (
    <div>
      <Card
        style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}
        title={
          <Space>
            <FlagOutlined style={{ color: '#fa541c' }} />
            <span style={{ color: textColor }}>
              {showOnlyProblem ? `题目 #${problemId} 的反馈` : '我的反馈记录'}
            </span>
          </Space>
        }
        extra={
          <Space>
            <Select
              allowClear
              placeholder="按状态筛选"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1) }}
              options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
            {problemId && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                提交反馈
              </Button>
            )}
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={reports}
          pagination={{
            current: page,
            total,
            pageSize: 15,
            onChange: setPage,
            showSizeChanger: false,
          }}
          locale={{ emptyText: <Empty description="还没有反馈记录" /> }}
          columns={[
            {
              title: '#',
              dataIndex: 'id',
              width: 60,
              render: (v) => <Text style={{ color: textColor }}>{v}</Text>,
            },
            {
              title: '题目',
              dataIndex: 'problem_title',
              ellipsis: true,
              render: (v, r: any) => (
                <Tooltip title={v}>
                  <a onClick={() => navigate(`/problems/${r.problem_id}`)}>
                    #{r.problem_id} {v || ''}
                  </a>
                </Tooltip>
              ),
            },
            {
              title: '类别',
              dataIndex: 'category',
              width: 110,
              render: (v: ReportCategory) => <Tag>{CATEGORY_LABELS[v]}</Tag>,
            },
            {
              title: '严重度',
              dataIndex: 'severity',
              width: 90,
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
              width: 100,
              render: (v: ReportStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABELS[v]}</Tag>,
            },
            {
              title: '提交时间',
              dataIndex: 'created_at',
              width: 130,
              render: (v) => <Text type="secondary">{dayjs(v).fromNow()}</Text>,
            },
            {
              title: '处理意见',
              dataIndex: 'admin_comment',
              ellipsis: true,
              render: (v) => v ? <Text type="secondary">{v}</Text> : <Text type="secondary">-</Text>,
            },
          ]}
        />
      </Card>

      <ReportModal
        open={modalOpen}
        problemId={problemId}
        problemTitle={problemTitle}
        onClose={() => setModalOpen(false)}
        onSubmitted={load}
      />
    </div>
  )
}

export default ReportList

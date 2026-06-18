import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Select, Tag, Typography, Space, Spin, message, Empty } from 'antd'
import { ArrowLeftOutlined, SwapOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { DiffEditor } from '@monaco-editor/react'
import { submissionService } from '../../services/submission.service'
import { useTheme } from '../../components/common/ThemeSwitcher'

const { Title, Text, Paragraph } = Typography

const SubmissionCompare = () => {
  const { id1, id2 } = useParams<{ id1: string; id2: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [sub1, setSub1] = useState<any>(null)
  const [sub2, setSub2] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<any[]>([])

  const loadBoth = async () => {
    if (!id1) return
    setLoading(true)
    try {
      const a = await submissionService.getSubmissionById(Number(id1))
      setSub1(a)

      // 拉同一用户对同题的其它提交作为候选
      const others = await submissionService.getUserSubmissions(a.user_id, {
        problem_id: a.problem_id,
        limit: 50,
      })
      const filtered = others.filter((s: any) => s.id !== a.id)
      setCandidates(filtered)

      // 如果有 id2 直接加载
      if (id2) {
        const b = await submissionService.getSubmissionById(Number(id2))
        setSub2(b)
      } else if (filtered.length > 0) {
        // 自动选最近的另一个提交作为默认对比对象
        const first = filtered[0]
        const b = await submissionService.getSubmissionById(first.id)
        setSub2(b)
        navigate(`/submissions/compare/${id1}/${first.id}`, { replace: true })
      } else {
        setSub2(null)
      }
    } catch {
      message.error('加载提交失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBoth() }, [id1, id2])

  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e'

  const statusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      accepted: { color: 'success', text: '通过' },
      wrong_answer: { color: 'error', text: '答案错误' },
      time_limit_exceeded: { color: 'warning', text: '超时' },
      memory_limit_exceeded: { color: 'warning', text: '内存超限' },
      runtime_error: { color: 'error', text: '运行时错误' },
      compilation_error: { color: 'error', text: '编译错误' },
      pending: { color: 'processing', text: '等待' },
      judging: { color: 'processing', text: '评测中' },
    }
    const c = map[status] || { color: 'default', text: status }
    return <Tag color={c.color}>{c.text}</Tag>
  }

  if (loading) {
    return <Card style={{ margin: 24 }}><Spin size="large" /></Card>
  }

  if (!sub1 || !sub2) {
    return <Card style={{ margin: 24 }}><Empty description="找不到提交记录" /></Card>
  }

  if (sub1.language !== sub2.language) {
    return (
      <Card style={{ margin: 24 }}>
        <Empty description="两次提交的编程语言不同，无法对比" />
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      </Space>

      <Card style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12, marginBottom: 16 }}>
        <Title level={3} style={{ color: textColor, marginBottom: 8 }}>
          <SwapOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
          代码对比
        </Title>
        <Paragraph type="secondary">
          题目：<Text strong>#{sub1.problem_id} {sub1.problem_title || sub1.problem_no || ''}</Text>
        </Paragraph>

        <Space wrap style={{ marginBottom: 16 }}>
          <Text type="secondary">与其它提交对比：</Text>
          <Select
            style={{ width: 320 }}
            placeholder="选择另一个提交"
            value={Number(id2)}
            onChange={(val) => navigate(`/submissions/compare/${id1}/${val}`)}
            options={candidates.map(s => ({
              value: s.id,
              label: `#${s.id} · ${s.status} · ${new Date(s.created_at).toLocaleString()}`,
            }))}
          />
        </Space>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <SubmissionBrief sub={sub1} statusTag={statusTag} textColor={textColor} />
          <SubmissionBrief sub={sub2} statusTag={statusTag} textColor={textColor} />
        </div>
      </Card>

      <Card
        style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}
        styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: 12 } }}
      >
        <DiffEditor
          height="70vh"
          originalLanguage={sub1.language}
          modifiedLanguage={sub2.language}
          original={sub1.code || ''}
          modified={sub2.code || ''}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
          }}
        />
      </Card>
    </div>
  )
}

const SubmissionBrief = ({ sub, statusTag, textColor }: any) => (
  <Card
    size="small"
    style={{ flex: '1 1 280px', minWidth: 240 }}
    title={<Space>#{sub.id} {statusTag(sub.status)}</Space>}
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
      <Text type="secondary">语言</Text>
      <Text style={{ color: textColor }}>{sub.language}</Text>

      <Text type="secondary">运行</Text>
      <Text style={{ color: textColor }}>
        {sub.runtime != null ? `${sub.runtime}ms` : '-'}
        {sub.memory != null ? ` / ${(sub.memory / 1024).toFixed(1)}MB` : ''}
      </Text>

      <Text type="secondary">时间</Text>
      <Text style={{ color: textColor }}>{new Date(sub.created_at).toLocaleString()}</Text>

      <Text type="secondary">结果</Text>
      {sub.status === 'accepted'
        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
        : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
    </div>
  </Card>
)

export default SubmissionCompare

import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, Typography, message, Switch, Space, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import codeShareService from '../../services/codeShare.service'
import { submissionService } from '../../services/submission.service'

const { TextArea } = Input

const languages = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'Go', 'Rust', 'TypeScript']

const CodeShareEditor = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    const submissionId = searchParams.get('submission_id')
    const problemId = searchParams.get('problem_id')
    if (submissionId) loadSubmission(Number(submissionId), problemId ? Number(problemId) : undefined)
    if (problemId && !submissionId) form.setFieldsValue({ problem_id: Number(problemId) })
  }, [])

  const loadSubmission = async (submissionId: number, problemId?: number) => {
    try {
      const sub = await submissionService.getSubmissionById(submissionId)
      form.setFieldsValue({
        code: sub.code,
        language: sub.language,
        problem_id: problemId || sub.problem_id,
        title: `Solution for #${sub.problem_id}`,
      })
    } catch { message.error('加载提交失败') }
  }

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true)
      await codeShareService.createSharedCode({ ...values, tags })
      message.success('代码分享成功')
      navigate('/code-shares')
    } catch { message.error('分享失败') }
    finally { setSaving(false) }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput('') }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>分享代码</Typography.Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ language: 'C++', is_public: true }}>
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="代码标题" />
          </Form.Item>

          <Form.Item label="关联题目 ID（可选）" name="problem_id">
            <Input type="number" placeholder="题目 ID" />
          </Form.Item>

          <Form.Item label="语言" name="language" rules={[{ required: true }]}>
            <Select>{languages.map(l => <Select.Option key={l} value={l}>{l}</Select.Option>)}</Select>
          </Form.Item>

          <Form.Item label="代码" name="code" rules={[{ required: true, message: '请输入代码' }]}>
            <TextArea rows={15} style={{ fontFamily: 'monospace', fontSize: 13 }} placeholder="粘贴或输入代码..." />
          </Form.Item>

          <Form.Item label="描述（可选）" name="description">
            <TextArea rows={3} placeholder="描述一下你的解法..." />
          </Form.Item>

          <Form.Item label="标签">
            <Space wrap style={{ marginBottom: 8 }}>
              {tags.map(t => <Tag key={t} closable onClose={() => setTags(tags.filter(x => x !== t))}>{t}</Tag>)}
            </Space>
            <Input.Search value={tagInput} onChange={e => setTagInput(e.target.value)}
              onSearch={addTag} enterButton="添加" style={{ width: 200 }} placeholder="输入标签" />
          </Form.Item>

          <Form.Item label="公开" name="is_public" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} size="large">分享代码</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default CodeShareEditor

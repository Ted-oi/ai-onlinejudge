import { useState } from 'react'
import { Card, Form, Input, Select, Button, Typography, message, Switch, InputNumber, Space, Divider } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import learningPathService from '../../services/learningPath.service'

const categories = ['动态规划', '图论', '数据结构', '数学', '贪心', '字符串', '搜索', '基础算法']
const colors = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777']

const AdminLearningPathForm = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true)
      await learningPathService.createLearningPath(values)
      message.success('学习路径创建成功')
      navigate('/admin/learning-paths')
    } catch { message.error('创建失败') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>创建学习路径</Typography.Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ cover_color: '#4f46e5', is_published: false, stages: [{ title: '', problems: [] }] }}>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="学习路径标题" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="描述这个学习路径..." />
          </Form.Item>
          <Space size={16}>
            <Form.Item label="分类" name="category" rules={[{ required: true }]}>
              <Select style={{ width: 160 }}>{categories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}</Select>
            </Form.Item>
            <Form.Item label="颜色" name="cover_color">
              <Select style={{ width: 120 }}>
                {colors.map(c => <Select.Option key={c} value={c}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: c, marginRight: 8 }} />{c}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="预计时长(小时)" name="estimated_hours">
              <InputNumber min={1} max={200} />
            </Form.Item>
          </Space>
          <Form.Item label="发布" name="is_published" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider>学习阶段</Divider>

          <Form.List name="stages">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }}>
                    <Space style={{ width: '100%' }} align="start">
                      <Form.Item {...rest} name={[name, 'title']} label={`阶段 ${name + 1} 标题`} rules={[{ required: true }]} style={{ flex: 1 }}>
                        <Input placeholder="阶段标题" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'description']} label="描述" style={{ flex: 1 }}>
                        <Input placeholder="阶段描述" />
                      </Form.Item>
                      <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ marginTop: 24 }} />
                    </Space>
                    <Form.Item {...rest} name={[name, 'problems']} label="题目 ID（逗号分隔）">
                      <Input placeholder="例如: 1, 5, 12, 34" />
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ title: '', problems: [] })}>添加阶段</Button>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={saving} size="large">创建</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default AdminLearningPathForm

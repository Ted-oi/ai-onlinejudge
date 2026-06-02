import { useState } from 'react'
import { Card, Form, Input, Select, Button, Typography, InputNumber, Switch, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import teamService from '../../services/team.service'

const CreateTeam = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true)
      const data = await teamService.createTeam(values)
      message.success('创建成功')
      navigate(`/teams/${data.team.id}`)
    } catch (e: any) { message.error(e?.response?.data?.error?.message || '创建失败') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>创建团队/班级</Typography.Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ team_type: 'team', max_members: 50, is_public: true }}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="团队或班级名称" />
          </Form.Item>
          <Form.Item label="类型" name="team_type">
            <Select>
              <Select.Option value="team">团队</Select.Option>
              {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                <Select.Option value="class">班级</Select.Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="描述..." />
          </Form.Item>
          <Form.Item label="最大人数" name="max_members">
            <InputNumber min={2} max={500} />
          </Form.Item>
          <Form.Item label="公开" name="is_public" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} size="large">创建</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default CreateTeam

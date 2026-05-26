import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Typography, message, Spin } from 'antd'
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import userService from '../../services/user.service'

const { Title } = Typography

const UserSettings = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (id) fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const user = await userService.getUserById(Number(id))
      form.setFieldsValue({
        username: user.username,
        avatar: user.avatar || '',
        bio: user.bio || '',
      })
    } catch (error) {
      message.error('获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values: any) => {
    try {
      setSaving(true)
      const updatedUser = await userService.updateUser(Number(id), values)
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedUser }))
      message.success('个人信息更新成功')
      navigate(`/users/${id}`)
    } catch (error) {
      message.error('更新失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>编辑个人资料</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            label="头像 URL"
            name="avatar"
          >
            <Input placeholder="头像图片链接" />
          </Form.Item>

          <Form.Item
            label="个人简介"
            name="bio"
          >
            <Input.TextArea rows={4} placeholder="介绍一下自己..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} size="large">
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default UserSettings

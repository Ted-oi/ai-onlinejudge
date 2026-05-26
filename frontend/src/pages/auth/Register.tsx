import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Select, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'

const { Title } = Typography
const { Option } = Select

const Register = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      const result = await authService.register(values)

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))

      message.success('注册成功')
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>AI OnlineJudge</Title>
          <Typography.Text>创建新账户</Typography.Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="student"
          >
            <Select placeholder="选择角色">
              <Option value="student">学生</Option>
              <Option value="teacher">教师</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Typography.Text>
              已有账户？{' '}
              <a onClick={() => navigate('/login')}>立即登录</a>
            </Typography.Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
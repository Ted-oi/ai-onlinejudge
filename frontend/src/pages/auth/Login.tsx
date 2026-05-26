import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'

const { Title } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      const result = await authService.login(values)

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))

      message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '登录失败')
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
          <Typography.Text>登录您的账户</Typography.Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Typography.Text>
              还没有账户？{' '}
              <a onClick={() => navigate('/register')}>立即注册</a>
            </Typography.Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  CodeOutlined,
  TeamOutlined,
  TrophyOutlined,
  BookOutlined,
  FileSearchOutlined,
  UserOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'

const { Header, Content, Sider } = AntLayout

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/admin/problems',
      icon: <CodeOutlined />,
      label: '题目管理',
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin/contests',
      icon: <TrophyOutlined />,
      label: '竞赛管理',
    },
    {
      key: '/admin/courses',
      icon: <BookOutlined />,
      label: '课程管理',
    },
    {
      key: '/admin/submissions',
      icon: <FileSearchOutlined />,
      label: '提交审查',
    },
    {
      key: '/',
      icon: <ArrowLeftOutlined />,
      label: '返回前台',
    },
  ]

  const userMenuItems = [
    {
      key: 'back',
      icon: <ArrowLeftOutlined />,
      label: '返回前台',
      onClick: () => navigate('/'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      },
    },
  ]

  const getSelectedKey = () => {
    const path = location.pathname
    if (path === '/admin') return '/admin'
    const match = menuItems.find(item => item.key !== '/admin' && path.startsWith(item.key))
    return match ? match.key : '/admin'
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: collapsed ? 12 : 14,
          }}
        >
          {collapsed ? '管理' : '管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500, color: '#666' }}>
            管理后台
          </span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user.username}</span>
              <span style={{ fontSize: 12, color: '#999' }}>({user.role})</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: 8 }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default AdminLayout

import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space } from 'antd'
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
  UnorderedListOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import NotificationCenter from '../common/NotificationCenter'
import ThemeSwitcher, { useTheme } from '../common/ThemeSwitcher'

const { Header, Content, Sider } = AntLayout

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const bgColor = isDark ? '#1f1f1f' : '#fff'
  const borderColor = isDark ? '#303030' : '#f0f0f0'
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : '#1a1a2e'
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : '#999'
  const bg = isDark ? '#141414' : '#fff'

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/admin/problems', icon: <CodeOutlined />, label: '题目管理' },
    { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/admin/contests', icon: <TrophyOutlined />, label: '竞赛管理' },
    { key: '/admin/courses', icon: <BookOutlined />, label: '课程管理' },
    { key: '/admin/problem-sets', icon: <UnorderedListOutlined />, label: '题单管理' },
    { key: '/admin/submissions', icon: <FileSearchOutlined />, label: '提交审查' },
    { key: '/admin/article-review', icon: <AuditOutlined />, label: '文章审核' },
    { key: '/', icon: <ArrowLeftOutlined />, label: '返回前台' },
  ]

  const userMenuItems = [
    { key: 'back', icon: <ArrowLeftOutlined />, label: '返回前台', onClick: () => navigate('/') },
    { type: 'divider' as const },
    {
      key: 'logout', icon: <LogoutOutlined />, label: '退出登录',
      onClick: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login') },
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
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="app-sider"
        width={220}
        style={{
          background: bgColor,
          borderRight: `1px solid ${borderColor}`,
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${borderColor}`,
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 'bold', fontSize: 14,
          }}>
            管
          </div>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: 15, color: textColor }}>
              管理后台
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            border: 'none',
            padding: '8px 0',
            background: 'transparent',
          }}
        />
      </Sider>
      <AntLayout style={{ background: bg }}>
        <Header style={{
          padding: '0 24px',
          background: bg,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: textColor }}>
            管理后台
          </span>
          <Space size={16}>
            <NotificationCenter />
            <ThemeSwitcher />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />}
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} />
                <span style={{ color: textColor }}>{user.username}</span>
                <span style={{ fontSize: 12, color: subColor }}>({user.role})</span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px 0', background: bg }}>
          <div style={{ padding: 24, minHeight: 360, borderRadius: 8 }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default AdminLayout

import { useState, useMemo } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space, Button } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  CodeOutlined,
  TrophyOutlined,
  BookOutlined,
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
  CrownOutlined,
  SettingOutlined,
  MenuOutlined,
  UnorderedListOutlined,
  ReadOutlined,
  ThunderboltOutlined,
  ShareAltOutlined,
  CompassOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import NotificationCenter from '../common/NotificationCenter'
import ThemeSwitcher, { useTheme } from '../common/ThemeSwitcher'

const { Header, Content, Sider } = AntLayout

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/problems', icon: <CodeOutlined />, label: '题库' },
    { key: '/problem-sets', icon: <UnorderedListOutlined />, label: '题单' },
    { key: '/articles', icon: <ReadOutlined />, label: '博客/题解' },
    { key: '/code-shares', icon: <ShareAltOutlined />, label: '代码分享' },
    { type: 'divider' as const },
    { key: '/contests', icon: <TrophyOutlined />, label: '比赛' },
    { key: '/leaderboard', icon: <CrownOutlined />, label: '排行榜' },
    { key: '/courses', icon: <BookOutlined />, label: '课程' },
    { key: '/learning-paths', icon: <CompassOutlined />, label: '学习路径' },
    { key: '/teams', icon: <TeamOutlined />, label: '团队/班级' },
    { key: '/ai', icon: <RobotOutlined />, label: 'AI助手' },
    { key: '/submissions', icon: <ThunderboltOutlined />, label: '提交记录' },
    ...(user.role === 'admin' || user.role === 'teacher'
      ? [{ type: 'divider' as const }, { key: '/admin', icon: <SettingOutlined />, label: '管理后台' }]
      : []),
  ].filter(Boolean)

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate(`/users/${user.id}`) },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const bg = isDark ? '#141414' : '#fff'
  const bgColor = isDark ? '#1f1f1f' : '#fff'
  const borderColor = isDark ? '#303030' : '#f0f0f0'
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : '#1a1a2e'
  const contentBg = isDark ? '#141414' : '#f5f5f5'
  const pillBg = isDark ? '#2a2a2a' : '#f5f5f5'

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        breakpoint="lg"
        collapsedWidth={0}
        className="app-sider"
        style={{
          background: bgColor,
          borderRight: `1px solid ${borderColor}`,
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
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
            color: '#fff', fontWeight: 'bold', fontSize: 16,
          }}>
            OJ
          </div>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: 16, color: textColor }}>
              AI OnlineJudge
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={['/' + location.pathname.split('/')[1]]}
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
          position: 'sticky', top: 0, zIndex: 10,
        }} className="site-layout-header">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ display: 'none' }}
            className="mobile-menu-btn"
          />
          <Space size={16}>
            <NotificationCenter />
            <ThemeSwitcher />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 12px', borderRadius: 20,
                background: pillBg, transition: 'background 0.2s',
              }}>
                <Avatar size={24} icon={<UserOutlined />} src={user.avatar}
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} />
                <span style={{ fontWeight: 500, color: textColor }}>{user.username || '未登录'}</span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 0, padding: '24px', background: contentBg, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout

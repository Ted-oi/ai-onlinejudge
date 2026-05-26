import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  CodeOutlined,
  TrophyOutlined,
  BookOutlined,
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const { Header, Content, Sider } = AntLayout

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/problems',
      icon: <CodeOutlined />,
      label: '题目',
    },
    {
      key: '/submissions',
      icon: <CodeOutlined />,
      label: '提交记录',
    },
    {
      key: '/contests',
      icon: <TrophyOutlined />,
      label: '比赛',
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程',
    },
    {
      key: '/ai',
      icon: <RobotOutlined />,
      label: 'AI助手',
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate(`/users/${user.id}`),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
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
          }}
        >
          {collapsed ? 'OJ' : 'AI OnlineJudge'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={['/' + location.pathname.split('/')[1]]}
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
          }}
        >
          <div />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={user.avatar}
              />
              <span>{user.username || '未登录'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
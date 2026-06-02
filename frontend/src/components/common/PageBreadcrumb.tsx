import { useLocation, Link } from 'react-router-dom'
import { Breadcrumb } from 'antd'

const labelMap: Record<string, string> = {
  problems: '题库',
  submissions: '提交记录',
  contests: '比赛',
  courses: '课程',
  leaderboard: '排行榜',
  articles: '博客/题解',
  'code-shares': '代码分享',
  'learning-paths': '学习路径',
  teams: '团队/班级',
  ai: 'AI助手',
  users: '用户',
  'problem-sets': '题单',
  admin: '管理后台',
  dashboard: '仪表盘',
  assign: '作业',
  discuss: '讨论',
  solutions: '题解',
  edit: '编辑',
  create: '创建',
  settings: '设置',
  members: '成员',
}

const homeLabel: Record<string, string> = {
  '/': '首页',
  '/admin': '管理后台',
}

const PageBreadcrumb = () => {
  const location = useLocation()
  const pathSnippets = location.pathname.split('/').filter((i) => i)

  if (pathSnippets.length === 0) return null
  if (pathSnippets.length === 1 && (location.pathname === '/' || location.pathname === '/admin')) return null

  const items = [
    {
      title: <Link to={pathSnippets[0] === 'admin' ? '/admin' : '/'}>{homeLabel[location.pathname] || labelMap[pathSnippets[0]] || '首页'}</Link>,
    },
    ...pathSnippets.slice(1).map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 2).join('/')}`
      const label = labelMap[pathSnippets[index + 1]] || pathSnippets[index + 1]
      const isLast = index === pathSnippets.length - 2
      return {
        title: isLast ? label : <Link to={url}>{label}</Link>,
      }
    }),
  ]

  return (
    <Breadcrumb style={{ marginBottom: 16 }} items={items} />
  )
}

export default PageBreadcrumb

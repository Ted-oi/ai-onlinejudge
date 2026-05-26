import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/home/Home'
import ProblemList from './pages/problems/ProblemList'
import ProblemDetail from './pages/problems/ProblemDetail'
import ProblemSubmit from './pages/problems/ProblemSubmit'
import SubmissionList from './pages/submissions/SubmissionList'
import SubmissionDetail from './pages/submissions/SubmissionDetail'
import CourseList from './pages/courses/CourseList'
import CourseDetail from './pages/courses/CourseDetail'
import ContestList from './pages/contests/ContestList'
import ContestDetail from './pages/contests/ContestDetail'
import AiChat from './pages/ai/AiChat'
import UserProfile from './pages/user/UserProfile'
import UserSettings from './pages/user/UserSettings'

// 认证守卫组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          {/* 认证页面 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 主应用路由 */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="problems" element={<ProblemList />} />
            <Route path="problems/:id" element={<ProblemDetail />} />
            <Route path="problems/:id/submit" element={<ProblemSubmit />} />
            <Route path="submissions" element={<SubmissionList />} />
            <Route path="submissions/:id" element={<SubmissionDetail />} />
            <Route path="courses" element={<CourseList />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="contests" element={<ContestList />} />
            <Route path="contests/:id" element={<ContestDetail />} />
            <Route path="ai" element={<AiChat />} />
            <Route path="users/:id" element={<UserProfile />} />
            <Route path="users/:id/settings" element={<UserSettings />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
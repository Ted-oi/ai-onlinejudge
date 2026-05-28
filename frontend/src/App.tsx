import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'
import AdminRoute from './components/common/AdminRoute'
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
import Leaderboard from './pages/leaderboard/Leaderboard'
import AiChat from './pages/ai/AiChat'
import UserProfile from './pages/user/UserProfile'
import UserSettings from './pages/user/UserSettings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProblemList from './pages/admin/AdminProblemList'
import AdminProblemForm from './pages/admin/AdminProblemForm'
import AdminUserList from './pages/admin/AdminUserList'
import AdminContestList from './pages/admin/AdminContestList'
import AdminContestForm from './pages/admin/AdminContestForm'
import AdminCourseList from './pages/admin/AdminCourseList'
import AdminCourseForm from './pages/admin/AdminCourseForm'
import AdminSubmissionList from './pages/admin/AdminSubmissionList'

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="contests" element={<ContestList />} />
            <Route path="contests/:id" element={<ContestDetail />} />
            <Route path="ai" element={<AiChat />} />
            <Route path="users/:id" element={<UserProfile />} />
            <Route path="users/:id/settings" element={<UserSettings />} />
            <Route path="*" element={<Home />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="problems" element={<AdminProblemList />} />
            <Route path="problems/create" element={<AdminProblemForm />} />
            <Route path="problems/:id/edit" element={<AdminProblemForm />} />
            <Route path="users" element={<AdminUserList />} />
            <Route path="contests" element={<AdminContestList />} />
            <Route path="contests/create" element={<AdminContestForm />} />
            <Route path="contests/:id/edit" element={<AdminContestForm />} />
            <Route path="courses" element={<AdminCourseList />} />
            <Route path="courses/create" element={<AdminCourseForm />} />
            <Route path="courses/:id/edit" element={<AdminCourseForm />} />
            <Route path="submissions" element={<AdminSubmissionList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App

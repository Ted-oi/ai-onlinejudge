import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme as antTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'
import AdminRoute from './components/common/AdminRoute'
import { ThemeProvider, useTheme } from './components/common/ThemeSwitcher'
import PageErrorBoundary from './components/common/PageErrorBoundary'
import LoadingSkeleton from './components/common/LoadingSkeleton'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/home/Home'

const ProblemList = React.lazy(() => import('./pages/problems/ProblemList'))
const ProblemDetail = React.lazy(() => import('./pages/problems/ProblemDetail'))
const ProblemSubmit = React.lazy(() => import('./pages/problems/ProblemSubmit'))
const ObjectiveSubmit = React.lazy(() => import('./pages/problems/ObjectiveSubmit'))
const SubmissionList = React.lazy(() => import('./pages/submissions/SubmissionList'))
const SubmissionDetail = React.lazy(() => import('./pages/submissions/SubmissionDetail'))
const CourseList = React.lazy(() => import('./pages/courses/CourseList'))
const CourseDetail = React.lazy(() => import('./pages/courses/CourseDetail'))
const ContestList = React.lazy(() => import('./pages/contests/ContestList'))
const ContestDetail = React.lazy(() => import('./pages/contests/ContestDetail'))
const Leaderboard = React.lazy(() => import('./pages/leaderboard/Leaderboard'))
const AiChat = React.lazy(() => import('./pages/ai/AiChat'))
const UserProfile = React.lazy(() => import('./pages/user/UserProfile'))
const UserSettings = React.lazy(() => import('./pages/user/UserSettings'))
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProblemList = React.lazy(() => import('./pages/admin/AdminProblemList'))
const AdminProblemForm = React.lazy(() => import('./pages/admin/AdminProblemForm'))
const AdminUserList = React.lazy(() => import('./pages/admin/AdminUserList'))
const AdminContestList = React.lazy(() => import('./pages/admin/AdminContestList'))
const AdminContestForm = React.lazy(() => import('./pages/admin/AdminContestForm'))
const AdminCourseList = React.lazy(() => import('./pages/admin/AdminCourseList'))
const AdminCourseForm = React.lazy(() => import('./pages/admin/AdminCourseForm'))
const AdminSubmissionList = React.lazy(() => import('./pages/admin/AdminSubmissionList'))
const DiscussionList = React.lazy(() => import('./pages/discussions/DiscussionList'))
const DiscussionDetail = React.lazy(() => import('./pages/discussions/DiscussionDetail'))
const AssignmentDetail = React.lazy(() => import('./pages/assignments/AssignmentDetail'))
const ProblemSetList = React.lazy(() => import('./pages/problemSets/ProblemSetList'))
const ProblemSetDetail = React.lazy(() => import('./pages/problemSets/ProblemSetDetail'))
const AdminProblemSetList = React.lazy(() => import('./pages/admin/AdminProblemSetList'))
const AdminProblemSetForm = React.lazy(() => import('./pages/admin/AdminProblemSetForm'))
const AdminTeamList = React.lazy(() => import('./pages/admin/AdminTeamList'))
const ArticleList = React.lazy(() => import('./pages/articles/ArticleList'))
const ArticleDetail = React.lazy(() => import('./pages/articles/ArticleDetail'))
const ArticleEditor = React.lazy(() => import('./pages/articles/ArticleEditor'))
const MyArticles = React.lazy(() => import('./pages/articles/MyArticles'))
const ArticleFavorites = React.lazy(() => import('./pages/articles/ArticleFavorites'))
const AdminArticleReview = React.lazy(() => import('./pages/admin/AdminArticleReview'))
const AdminCodeShareList = React.lazy(() => import('./pages/admin/AdminCodeShareList'))
const CodeShareList = React.lazy(() => import('./pages/codeShare/CodeShareList'))
const CodeShareDetail = React.lazy(() => import('./pages/codeShare/CodeShareDetail'))
const CodeShareEditor = React.lazy(() => import('./pages/codeShare/CodeShareEditor'))
const LearningPathList = React.lazy(() => import('./pages/learningPaths/LearningPathList'))
const LearningPathDetail = React.lazy(() => import('./pages/learningPaths/LearningPathDetail'))
const AdminLearningPathForm = React.lazy(() => import('./pages/admin/AdminLearningPathForm'))
const TeamList = React.lazy(() => import('./pages/teams/TeamList'))
const TeamDetail = React.lazy(() => import('./pages/teams/TeamDetail'))
const CreateTeam = React.lazy(() => import('./pages/teams/CreateTeam'))
const NotFoundPage = React.lazy(() => import('./components/common/NotFoundPage'))

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <PageErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="detail" />}>
      {children}
    </Suspense>
  </PageErrorBoundary>
)

function ThemedApp() {
  const { theme } = useTheme()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
        },
        components: {
          Menu: {
            itemBorderRadius: 8,
            itemMarginInline: 8,
            itemHeight: 44,
          },
          Card: {
            borderRadius: 12,
          },
          Button: {
            borderRadius: 8,
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="problems" element={<LazyPage><ProblemList /></LazyPage>} />
            <Route path="problems/:id" element={<LazyPage><ProblemDetail /></LazyPage>} />
            <Route path="problems/:id/submit" element={<LazyPage><ProblemSubmit /></LazyPage>} />
            <Route path="problems/:id/answer" element={<LazyPage><ObjectiveSubmit /></LazyPage>} />
            <Route path="submissions" element={<LazyPage><SubmissionList /></LazyPage>} />
            <Route path="submissions/:id" element={<LazyPage><SubmissionDetail /></LazyPage>} />
            <Route path="courses" element={<LazyPage><CourseList /></LazyPage>} />
            <Route path="courses/:id" element={<LazyPage><CourseDetail /></LazyPage>} />
            <Route path="leaderboard" element={<LazyPage><Leaderboard /></LazyPage>} />
            <Route path="problem-sets" element={<LazyPage><ProblemSetList /></LazyPage>} />
            <Route path="problem-sets/:id" element={<LazyPage><ProblemSetDetail /></LazyPage>} />
            <Route path="contests" element={<LazyPage><ContestList /></LazyPage>} />
            <Route path="contests/:id" element={<LazyPage><ContestDetail /></LazyPage>} />
            <Route path="ai" element={<LazyPage><AiChat /></LazyPage>} />
            <Route path="users/:id" element={<LazyPage><UserProfile /></LazyPage>} />
            <Route path="users/:id/settings" element={<LazyPage><UserSettings /></LazyPage>} />
            <Route path="discussions/problem/:problemId" element={<LazyPage><DiscussionList /></LazyPage>} />
            <Route path="discussions/thread/:id" element={<LazyPage><DiscussionDetail /></LazyPage>} />
            <Route path="assignments/:id" element={<LazyPage><AssignmentDetail /></LazyPage>} />
            <Route path="articles" element={<LazyPage><ArticleList /></LazyPage>} />
            <Route path="articles/create/:type" element={<LazyPage><ArticleEditor /></LazyPage>} />
            <Route path="articles/:id" element={<LazyPage><ArticleDetail /></LazyPage>} />
            <Route path="articles/:id/edit" element={<LazyPage><ArticleEditor /></LazyPage>} />
            <Route path="my-articles" element={<LazyPage><MyArticles /></LazyPage>} />
            <Route path="favorites/articles" element={<LazyPage><ArticleFavorites /></LazyPage>} />
            <Route path="code-shares" element={<LazyPage><CodeShareList /></LazyPage>} />
            <Route path="code-shares/create" element={<LazyPage><CodeShareEditor /></LazyPage>} />
            <Route path="code-shares/:id" element={<LazyPage><CodeShareDetail /></LazyPage>} />
            <Route path="learning-paths" element={<LazyPage><LearningPathList /></LazyPage>} />
            <Route path="learning-paths/:id" element={<LazyPage><LearningPathDetail /></LazyPage>} />
            <Route path="teams" element={<LazyPage><TeamList /></LazyPage>} />
            <Route path="teams/create" element={<LazyPage><CreateTeam /></LazyPage>} />
            <Route path="teams/:id" element={<LazyPage><TeamDetail /></LazyPage>} />
            <Route path="*" element={<LazyPage><NotFoundPage /></LazyPage>} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>
          }>
            <Route index element={<LazyPage><AdminDashboard /></LazyPage>} />
            <Route path="problems" element={<LazyPage><AdminProblemList /></LazyPage>} />
            <Route path="problems/create" element={<LazyPage><AdminProblemForm /></LazyPage>} />
            <Route path="problems/:id/edit" element={<LazyPage><AdminProblemForm /></LazyPage>} />
            <Route path="users" element={<LazyPage><AdminUserList /></LazyPage>} />
            <Route path="contests" element={<LazyPage><AdminContestList /></LazyPage>} />
            <Route path="contests/create" element={<LazyPage><AdminContestForm /></LazyPage>} />
            <Route path="contests/:id/edit" element={<LazyPage><AdminContestForm /></LazyPage>} />
            <Route path="courses" element={<LazyPage><AdminCourseList /></LazyPage>} />
            <Route path="courses/create" element={<LazyPage><AdminCourseForm /></LazyPage>} />
            <Route path="courses/:id/edit" element={<LazyPage><AdminCourseForm /></LazyPage>} />
            <Route path="problem-sets" element={<LazyPage><AdminProblemSetList /></LazyPage>} />
            <Route path="problem-sets/create" element={<LazyPage><AdminProblemSetForm /></LazyPage>} />
            <Route path="problem-sets/:id/edit" element={<LazyPage><AdminProblemSetForm /></LazyPage>} />
            <Route path="submissions" element={<LazyPage><AdminSubmissionList /></LazyPage>} />
            <Route path="article-review" element={<LazyPage><AdminArticleReview /></LazyPage>} />
            <Route path="code-shares" element={<LazyPage><AdminCodeShareList /></LazyPage>} />
            <Route path="teams" element={<LazyPage><AdminTeamList /></LazyPage>} />
            <Route path="learning-paths" element={<LazyPage><AdminLearningPathForm /></LazyPage>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  )
}

export default App

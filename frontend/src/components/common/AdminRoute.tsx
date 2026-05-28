import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'admin' && user.role !== 'teacher') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default AdminRoute

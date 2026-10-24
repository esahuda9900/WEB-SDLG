import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Memuat sesi…</p>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

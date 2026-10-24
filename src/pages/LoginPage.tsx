import { FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { signIn, session, loading, isAdmin } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!loading && session && isAdmin) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    setSubmitting(true)
    const res = await signIn(email.trim(), password)
    setSubmitting(false)
    if (!res.ok) {
      setLocalError(res.message ?? 'Login gagal')
    }
  }

  return (
    <div className="page login-page">
      <h1>Masuk</h1>
      <p className="muted">Warranty Claim SDLG — hanya admin</p>

      <form className="card login-form" onSubmit={onSubmit}>
        {localError && (
          <div className="alert alert-error" role="alert">
            {localError}
          </div>
        )}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </label>

        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>

        <p className="muted small">
          Pendaftaran publik dimatikan. Akun dibuat oleh admin.
        </p>
      </form>
    </div>
  )
}

import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import LoginPage from './pages/LoginPage'
import RequireAuth from './components/RequireAuth'
import ClaimsListPage from './pages/ClaimsListPage'
import ClaimDetailPlaceholder from './pages/ClaimDetailPlaceholder'

function Home() {
  const { user, role, signOut } = useAuth()

  return (
    <div className="page">
      <h1>Warranty Claim SDLG</h1>
      <p className="muted">Milestone M3 — Daftar klaim</p>
      <div className="card">
        <p>
          Masuk sebagai: <strong>{user?.email}</strong>
        </p>
        <p>
          Role: <strong>{role?.role ?? '—'}</strong>
        </p>
        <p>
          <Link className="btn primary" to="/klaim">
            Buka daftar klaim
          </Link>
        </p>
        <button type="button" className="btn" onClick={() => signOut()}>
          Keluar
        </button>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="page">
      <h1>Halaman tidak ditemukan</h1>
      <p>
        <Link to="/">Kembali ke beranda</Link>
      </p>
    </div>
  )
}

function Shell() {
  const { session, loading, isAdmin, signOut } = useAuth()

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">
          SDLG Warranty
        </Link>
        <nav className="nav">
          <span className="badge">M3 · Daftar</span>
          {!loading && session && isAdmin && (
            <>
              <Link to="/klaim" className="nav-link">
                Klaim
              </Link>
              <button type="button" className="nav-link btn-link" onClick={() => signOut()}>
                Keluar
              </button>
            </>
          )}
          {!loading && !session && (
            <Link to="/login" className="nav-link">
              Masuk
            </Link>
          )}
        </nav>
      </header>
      <main className="main-fluid">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/klaim"
            element={
              <RequireAuth>
                <ClaimsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/klaim/:claimId"
            element={
              <RequireAuth>
                <ClaimDetailPlaceholder />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>Dealer admin · paket gratis</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

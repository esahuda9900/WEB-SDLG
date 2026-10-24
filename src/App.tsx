import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import LoginPage from './pages/LoginPage'
import RequireAuth from './components/RequireAuth'

function Home() {
  const { user, role, signOut } = useAuth()

  return (
    <div className="page">
      <h1>Warranty Claim SDLG</h1>
      <p className="muted">Fondasi web baru — Milestone M2 (Login)</p>
      <div className="card">
        <p>
          Masuk sebagai: <strong>{user?.email}</strong>
        </p>
        <p>
          Role: <strong>{role?.role ?? '—'}</strong>
          {role?.display_name ? ` (${role.display_name})` : ''}
        </p>
        <p className="muted small">
          Daftar klaim dan fitur lain menyusul di milestone berikutnya.
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
  const { session, loading, isAdmin } = useAuth()

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">
          SDLG Warranty
        </Link>
        <nav className="nav">
          <span className="badge">M2 · Login</span>
          {!loading && session && isAdmin && (
            <Link to="/" className="nav-link">
              Beranda
            </Link>
          )}
          {!loading && !session && (
            <Link to="/login" className="nav-link">
              Masuk
            </Link>
          )}
        </nav>
      </header>
      <main>
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

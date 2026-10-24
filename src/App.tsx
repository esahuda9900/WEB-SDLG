import { Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <div className="page">
      <h1>Warranty Claim SDLG</h1>
      <p className="muted">Fondasi web baru — Milestone M1</p>
      <div className="card">
        <p>Web monitoring & submit klaim warranty ke principal SDLG.</p>
        <p>Status: <strong>sedang dibangun</strong>. Login dan daftar klaim menyusul di milestone berikutnya.</p>
      </div>
      <p className="muted small">Base path: /WEB-SDLG/ · HashRouter aktif</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="page">
      <h1>Halaman tidak ditemukan</h1>
      <p><Link to="/">Kembali ke beranda</Link></p>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">SDLG Warranty</Link>
        <nav>
          <span className="badge">M1 · Fondasi</span>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>Dealer admin · paket gratis</span>
      </footer>
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'

/** Placeholder M3 — detail penuh di M4. */
export default function ClaimDetailPlaceholder() {
  const { claimId } = useParams()

  return (
    <div className="page">
      <p className="muted small">
        <Link to="/klaim">← Kembali ke daftar</Link>
      </p>
      <h1>Detail klaim</h1>
      <div className="card">
        <p>
          Nomor PFR: <strong className="mono">{claimId}</strong>
        </p>
        <p className="muted">
          Halaman detail lengkap menyusul di milestone berikutnya (M4).
        </p>
      </div>
    </div>
  )
}

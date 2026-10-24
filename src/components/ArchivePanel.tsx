import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

type Props = {
  claimUuid: string
  claimIdLabel: string
  archivedAt: string | null
  onChanged: (next: { archived_at: string | null; last_updated: string }) => void
}

export default function ArchivePanel({
  claimUuid,
  claimIdLabel,
  archivedAt,
  onChanged,
}: Props) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function archive() {
    if (!window.confirm(`Arsipkan klaim ${claimIdLabel}? Klaim pindah ke tab Arsip.`)) return
    setBusy(true)
    setError(null)
    setMsg(null)
    const now = new Date().toISOString()
    const { error: err } = await supabase
      .from('claims')
      .update({
        archived_at: now,
        archived_by: user?.id ?? null,
        last_updated: now,
      })
      .eq('id', claimUuid)
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    onChanged({ archived_at: now, last_updated: now })
    setMsg('Klaim diarsipkan.')
  }

  async function unarchive() {
    if (!window.confirm(`Kembalikan klaim ${claimIdLabel} ke daftar aktif?`)) return
    setBusy(true)
    setError(null)
    setMsg(null)
    const now = new Date().toISOString()
    const { error: err } = await supabase
      .from('claims')
      .update({
        archived_at: null,
        archived_by: null,
        last_updated: now,
      })
      .eq('id', claimUuid)
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    onChanged({ archived_at: null, last_updated: now })
    setMsg('Klaim dikembalikan ke daftar aktif.')
  }

  return (
    <section className="card detail-block">
      <h2 className="detail-block-title">Arsip</h2>
      {archivedAt ? (
        <>
          <p className="muted">
            Klaim ini sudah diarsipkan. Tidak bisa diedit atau diubah status sampai dikembalikan.
          </p>
          <button type="button" className="btn" disabled={busy} onClick={() => void unarchive()}>
            {busy ? 'Memproses…' : 'Batalkan arsip'}
          </button>
        </>
      ) : (
        <>
          <p className="muted">
            Arsip memindahkan klaim ke tab <strong>Arsip</strong> di daftar. Data tidak dihapus.
          </p>
          <button type="button" className="btn" disabled={busy} onClick={() => void archive()}>
            {busy ? 'Memproses…' : 'Arsipkan klaim'}
          </button>
        </>
      )}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginTop: '0.75rem' }}>
          {error}
        </div>
      )}
      {msg && (
        <div className="alert alert-ok" role="status" style={{ marginTop: '0.75rem' }}>
          {msg}
        </div>
      )}
    </section>
  )
}

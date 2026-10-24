import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import {
  EDITABLE_DB_STATUSES,
  toDisplayStatus,
  type EditableDbStatus,
} from '../lib/claimStatus'

type Props = {
  claimUuid: string
  claimIdLabel: string
  currentStatus: string | null
  archivedAt: string | null
  onUpdated: (next: {
    claim_status: string
    status_update_reason: string | null
    rejection_reason: string | null
    status_date: string
    last_updated: string
  }) => void
}

export default function StatusChangePanel({
  claimUuid,
  claimIdLabel,
  currentStatus,
  archivedAt,
  onUpdated,
}: Props) {
  const [nextStatus, setNextStatus] = useState<string>(currentStatus ?? 'Draft')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (archivedAt) {
    return (
      <section className="card detail-block">
        <h2 className="detail-block-title">Ubah status</h2>
        <p className="muted">Klaim ini sudah diarsipkan. Status tidak diubah dari sini.</p>
      </section>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)

    if (!nextStatus) {
      setErr('Pilih status baru.')
      return
    }
    if (nextStatus === currentStatus) {
      setErr('Status sama dengan yang sekarang. Pilih status lain.')
      return
    }
    if (nextStatus === 'Rejected' && !reason.trim()) {
      setErr('Untuk status Rejected, isi alasan penolakan.')
      return
    }

    setSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
      claim_status: nextStatus,
      status_date: today,
      last_updated: now,
      status_update_reason: reason.trim() || null,
    }
    if (nextStatus === 'Rejected') {
      payload.rejection_reason = reason.trim()
    }

    const { error } = await supabase.from('claims').update(payload).eq('id', claimUuid)

    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }

    onUpdated({
      claim_status: nextStatus,
      status_update_reason: reason.trim() || null,
      rejection_reason: nextStatus === 'Rejected' ? reason.trim() : null,
      status_date: today,
      last_updated: now,
    })
    setMsg(`Status ${claimIdLabel} diubah menjadi ${nextStatus}.`)
    setReason('')
  }

  const preview = toDisplayStatus(nextStatus, null)

  return (
    <section className="card detail-block">
      <h2 className="detail-block-title">Ubah status</h2>
      <form className="status-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Status baru (nilai database)</span>
          <select
            className="select"
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
            disabled={saving}
          >
            {EDITABLE_DB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
                {s === currentStatus ? ' (sekarang)' : ''}
              </option>
            ))}
            {currentStatus &&
              !EDITABLE_DB_STATUSES.includes(currentStatus as EditableDbStatus) && (
                <option value={currentStatus}>{currentStatus} (sekarang)</option>
              )}
          </select>
        </label>

        <p className="muted small">
          Tampilan web akan jadi: <strong>{preview}</strong>
        </p>

        <label className="field">
          <span>
            Catatan / alasan{' '}
            {nextStatus === 'Rejected' ? '(wajib untuk Rejected)' : '(opsional)'}
          </span>
          <textarea
            className="textarea"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={saving}
            placeholder="Contoh: dokumen lengkap, siap submit SDLG…"
          />
        </label>

        {err && (
          <div className="alert alert-error" role="alert">
            {err}
          </div>
        )}
        {msg && (
          <div className="alert alert-ok" role="status">
            {msg}
          </div>
        )}

        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan status'}
        </button>
      </form>
    </section>
  )
}

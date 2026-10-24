import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

async function nextClaimId(): Promise<string> {
  const year = new Date().getFullYear()
  const { data, error } = await supabase
    .from('claims')
    .select('claim_id')
    .like('claim_id', `%-${year}-SDLG-PFR`)
    .order('claim_id', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)

  let max = 0
  for (const row of data ?? []) {
    const m = String(row.claim_id).match(/^(\d+)-/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > max) max = n
    }
  }
  const next = max + 1
  const padded = String(next).padStart(4, '0')
  return `${padded}-${year}-SDLG-PFR`
}

export default function NewClaimPage() {
  const navigate = useNavigate()
  const [model, setModel] = useState('')
  const [serialNo, setSerialNo] = useState('')
  const [customer, setCustomer] = useState('')
  const [branch, setBranch] = useState('')
  const [failureDate, setFailureDate] = useState('')
  const [faultDescription, setFaultDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!model.trim() && !serialNo.trim()) {
      setError('Isi minimal Model atau Serial.')
      return
    }

    setSaving(true)
    try {
      const claim_id = await nextClaimId()
      const now = new Date().toISOString()
      const today = now.slice(0, 10)

      const { error: insErr } = await supabase.from('claims').insert({
        claim_id,
        claim_status: 'Draft',
        model: model.trim() || null,
        serial_no: serialNo.trim() || null,
        customer: customer.trim() || null,
        branch: branch.trim() || null,
        failure_date: failureDate || null,
        fault_description: faultDescription.trim() || null,
        input_date: today,
        status_date: today,
        last_updated: now,
        currency: 'IDR',
        source_fields: {},
        source_provenance: { created_via: 'web-sdlg-m7' },
      })

      if (insErr) {
        setError(insErr.message)
        setSaving(false)
        return
      }

      navigate(`/klaim/${encodeURIComponent(claim_id)}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat klaim')
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <p className="muted small">
        <Link to="/klaim">← Kembali ke daftar</Link>
      </p>
      <h1>Klaim baru</h1>
      <p className="muted">
        Nomor PFR digenerate otomatis (format NNNN-tahun-SDLG-PFR). Status awal: Draft.
      </p>

      <form className="card login-form" style={{ maxWidth: 520 }} onSubmit={onSubmit}>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <label className="field">
          <span>Model</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Serial</span>
          <input value={serialNo} onChange={(e) => setSerialNo(e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Customer</span>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Cabang</span>
          <input value={branch} onChange={(e) => setBranch(e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Tanggal gagal</span>
          <input
            type="date"
            value={failureDate}
            onChange={(e) => setFailureDate(e.target.value)}
            disabled={saving}
          />
        </label>
        <label className="field">
          <span>Deskripsi kerusakan</span>
          <textarea
            className="textarea"
            rows={4}
            value={faultDescription}
            onChange={(e) => setFaultDescription(e.target.value)}
            disabled={saving}
          />
        </label>

        <div className="edit-actions">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Buat klaim'}
          </button>
          <Link className="btn" to="/klaim">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}

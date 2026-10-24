import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  invokeParsePfr,
  parsedToClaimRow,
  type ParsedPfr,
} from '../lib/parsePfr'

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
  return `${String(max + 1).padStart(4, '0')}-${year}-SDLG-PFR`
}

export default function ParsePfrPage() {
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ParsedPfr | null>(null)
  const [modelUsed, setModelUsed] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [existingId, setExistingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'preview'>('input')

  function setF(key: string, v: string) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  async function onParse(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setWarning(null)
    if (!raw.trim()) {
      setError('Tempel teks PFR dulu.')
      return
    }
    setBusy(true)
    try {
      const res = await invokeParsePfr(raw.trim())
      setParsed(res.data)
      setModelUsed(res.model)
      if (res.warning) setWarning(res.warning)

      const row = parsedToClaimRow(res.data, raw.trim())
      const claimId = row.claim_id_candidate

      setForm({
        claim_id: claimId ?? '',
        model: row.model ?? '',
        serial_no: row.serial_no ?? '',
        customer: row.customer ?? '',
        branch: row.branch ?? '',
        dealer_wo_so: row.dealer_wo_so ?? '',
        failure_date: row.failure_date ?? '',
        sales_date: row.sales_date ?? '',
        hm_failure: row.hm_failure != null ? String(row.hm_failure) : '',
        fault_description: row.fault_description ?? '',
        cause_analyze: row.cause_analyze ?? '',
        repair_method: row.repair_method ?? '',
        causing_part_no: row.causing_part_no ?? '',
        causing_part_desc: row.causing_part_desc ?? '',
        comment: row.comment ?? '',
        technical_personnel: row.technical_personnel ?? '',
      })

      if (claimId) {
        const { data: found } = await supabase
          .from('claims')
          .select('id, claim_id')
          .eq('claim_id', claimId)
          .maybeSingle()
        setExistingId(found?.id ?? null)
      } else {
        setExistingId(null)
      }
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse gagal')
    }
    setBusy(false)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const row = parsedToClaimRow(parsed ?? {}, raw.trim())
      let claimId = form.claim_id.trim()
      if (!claimId) claimId = await nextClaimId()

      const now = new Date().toISOString()
      const today = now.slice(0, 10)
      const payload = {
        claim_id: claimId,
        model: form.model.trim() || null,
        serial_no: form.serial_no.trim() || null,
        customer: form.customer.trim() || null,
        branch: form.branch.trim() || null,
        dealer_wo_so: form.dealer_wo_so.trim() || null,
        failure_date: form.failure_date.trim() || null,
        sales_date: form.sales_date.trim() || null,
        hm_failure: form.hm_failure.trim() ? Number(form.hm_failure) : null,
        fault_description: form.fault_description.trim() || null,
        cause_analyze: form.cause_analyze.trim() || null,
        repair_method: form.repair_method.trim() || null,
        causing_part_no: form.causing_part_no.trim() || null,
        causing_part_desc: form.causing_part_desc.trim() || null,
        comment: form.comment.trim() || null,
        technical_personnel: form.technical_personnel.trim() || null,
        engine_serial_no: row.engine_serial_no,
        indent_no: row.indent_no,
        dealer_name: row.dealer_name,
        distributor: row.distributor,
        dealer_code: row.dealer_code,
        dealer_claim_no: row.dealer_claim_no,
        app_code: row.app_code,
        sdlg_no: row.sdlg_no,
        dealer_repair_date: row.dealer_repair_date,
        completion_date: row.completion_date,
        dealer_claim_date: row.dealer_claim_date,
        hm_completion: row.hm_completion,
        failure_part_location: row.failure_part_location,
        mileage_to_site: row.mileage_to_site,
        labour_hrs: row.labour_hrs,
        labour_rate: row.labour_rate,
        mileage_km: row.mileage_km,
        mileage_rate: row.mileage_rate,
        other_amount: row.other_amount,
        currency: row.currency,
        claim_type: row.claim_type,
        repair_status: row.repair_status,
        parts: row.parts,
        source_raw_text: row.source_raw_text,
        source_fields: row.source_fields,
        source_provenance: row.source_provenance,
        last_updated: now,
      }

      if (existingId) {
        const { error: upErr } = await supabase
          .from('claims')
          .update(payload)
          .eq('id', existingId)
        if (upErr) throw new Error(upErr.message)
      } else {
        const { error: insErr } = await supabase.from('claims').insert({
          ...payload,
          claim_status: 'Draft',
          input_date: today,
          status_date: today,
        })
        if (insErr) throw new Error(insErr.message)
      }

      navigate(`/klaim/${encodeURIComponent(claimId)}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
      setBusy(false)
    }
  }

  if (step === 'input') {
    return (
      <div className="page">
        <p className="muted small">
          <Link to="/klaim">← Kembali ke daftar</Link>
        </p>
        <h1>Parse PFR</h1>
        <p className="muted">
          Tempel teks PFR (copy dari Excel/form). Sistem membaca isian, lalu Anda cek pratinjau sebelum
          simpan.
        </p>
        <form className="card" onSubmit={onParse}>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <label className="field">
            <span>Teks PFR</span>
            <textarea
              className="textarea"
              rows={14}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              disabled={busy}
              placeholder="Tempel di sini…"
            />
          </label>
          <div className="edit-actions">
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? 'Memproses…' : 'Parse teks'}
            </button>
            <Link className="btn" to="/klaim/baru">
              Input manual
            </Link>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      <p className="muted small">
        <button type="button" className="btn-link nav-link" onClick={() => setStep('input')}>
          ← Ubah teks
        </button>
      </p>
      <h1>Pratinjau hasil parse</h1>
      <p className="muted small">
        Engine: <strong>{modelUsed}</strong>
        {existingId
          ? ' · Nomor PFR sudah ada → simpan akan <strong>memperbarui</strong> klaim.'
          : ' · Klaim baru (Draft).'}
      </p>
      {warning && (
        <div className="alert alert-error" role="status">
          {warning}
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <form className="card detail-block" onSubmit={onSave}>
        <div className="edit-grid">
          {(
            [
              ['claim_id', 'No. PFR (kosong = auto)'],
              ['model', 'Model'],
              ['serial_no', 'Serial'],
              ['customer', 'Customer'],
              ['branch', 'Cabang'],
              ['dealer_wo_so', 'WO / SO'],
              ['sales_date', 'Tanggal jual'],
              ['failure_date', 'Tanggal gagal'],
              ['hm_failure', 'HM gagal'],
              ['causing_part_no', 'Part no penyebab'],
              ['causing_part_desc', 'Deskripsi part'],
              ['technical_personnel', 'Teknisi'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="field">
              <span>{label}</span>
              <input
                value={form[key] ?? ''}
                onChange={(e) => setF(key, e.target.value)}
                disabled={busy}
                type={key.includes('date') ? 'date' : 'text'}
              />
            </label>
          ))}
        </div>
        {(
          [
            ['fault_description', 'Deskripsi kerusakan'],
            ['cause_analyze', 'Analisis penyebab'],
            ['repair_method', 'Metode perbaikan'],
            ['comment', 'Komentar'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field">
            <span>{label}</span>
            <textarea
              className="textarea"
              rows={3}
              value={form[key] ?? ''}
              onChange={(e) => setF(key, e.target.value)}
              disabled={busy}
            />
          </label>
        ))}

        <div className="edit-actions">
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Menyimpan…' : existingId ? 'Update klaim' : 'Simpan klaim baru'}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => setStep('input')}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}

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

function str(v: unknown) {
  if (v === null || v === undefined) return ''
  return String(v)
}

export default function ParsePfrPage() {
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ParsedPfr | null>(null)
  const [modelUsed, setModelUsed] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [partsPreview, setPartsPreview] = useState<Record<string, unknown>[] | null>(null)
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
      setPartsPreview(row.parts)

      setForm({
        claim_id: claimId ?? '',
        model: str(row.model),
        serial_no: str(row.serial_no),
        engine_serial_no: str(row.engine_serial_no),
        indent_no: str(row.indent_no),
        customer: str(row.customer),
        branch: str(row.branch),
        distributor: str(row.distributor),
        dealer_name: str(row.dealer_name),
        dealer_code: str(row.dealer_code),
        dealer_claim_no: str(row.dealer_claim_no),
        dealer_wo_so: str(row.dealer_wo_so),
        app_code: str(row.app_code),
        sdlg_no: str(row.sdlg_no),
        sales_date: str(row.sales_date),
        failure_date: str(row.failure_date),
        dealer_repair_date: str(row.dealer_repair_date),
        completion_date: str(row.completion_date),
        dealer_claim_date: str(row.dealer_claim_date),
        hm_failure: row.hm_failure != null ? String(row.hm_failure) : '',
        hm_completion: row.hm_completion != null ? String(row.hm_completion) : '',
        fault_description: str(row.fault_description),
        cause_analyze: str(row.cause_analyze),
        repair_method: str(row.repair_method),
        causing_part_no: str(row.causing_part_no),
        causing_part_desc: str(row.causing_part_desc),
        failure_part_location: str(row.failure_part_location),
        comment: str(row.comment),
        technical_personnel: str(row.technical_personnel),
        labour_hrs: row.labour_hrs != null ? String(row.labour_hrs) : '',
        mileage_km: row.mileage_km != null ? String(row.mileage_km) : '',
        parts_total: row.parts_total != null ? String(row.parts_total) : '',
        total_amount: row.total_amount != null ? String(row.total_amount) : '',
        currency: str(row.currency),
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
      const n = (k: string) => (form[k]?.trim() ? Number(form[k]) : null)

      const payload = {
        claim_id: claimId,
        model: form.model.trim() || null,
        serial_no: form.serial_no.trim() || null,
        engine_serial_no: form.engine_serial_no.trim() || null,
        indent_no: form.indent_no.trim() || null,
        customer: form.customer.trim() || null,
        branch: form.branch.trim() || null,
        distributor: form.distributor.trim() || null,
        dealer_name: form.dealer_name.trim() || null,
        dealer_code: form.dealer_code.trim() || null,
        dealer_claim_no: form.dealer_claim_no.trim() || null,
        dealer_wo_so: form.dealer_wo_so.trim() || null,
        app_code: form.app_code.trim() || null,
        sdlg_no: form.sdlg_no.trim() || null,
        sales_date: form.sales_date.trim() || null,
        failure_date: form.failure_date.trim() || null,
        dealer_repair_date: form.dealer_repair_date.trim() || null,
        completion_date: form.completion_date.trim() || null,
        dealer_claim_date: form.dealer_claim_date.trim() || null,
        hm_failure: n('hm_failure'),
        hm_completion: n('hm_completion'),
        fault_description: form.fault_description.trim() || null,
        cause_analyze: form.cause_analyze.trim() || null,
        repair_method: form.repair_method.trim() || null,
        causing_part_no: form.causing_part_no.trim() || null,
        causing_part_desc: form.causing_part_desc.trim() || null,
        failure_part_location: form.failure_part_location.trim() || null,
        comment: form.comment.trim() || null,
        technical_personnel: form.technical_personnel.trim() || null,
        labour_hrs: n('labour_hrs'),
        labour_rate: row.labour_rate,
        labour_amount: row.labour_amount,
        mileage_km: n('mileage_km'),
        mileage_to_site: n('mileage_km') ?? row.mileage_to_site,
        mileage_rate: row.mileage_rate,
        mileage_amount: row.mileage_amount,
        other_amount: row.other_amount,
        parts_total: n('parts_total') ?? row.parts_total,
        total_amount: n('total_amount') ?? row.total_amount,
        currency: form.currency.trim() || null,
        claim_type: row.claim_type,
        repair_status: row.repair_status,
        parts: partsPreview ?? row.parts,
        photo_labels: row.photo_labels,
        photo_count: row.photo_count,
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
          Tempel teks PFR. Semua field yang terbaca (unit, tanggal, kerusakan, parts, biaya) disimpan ke
          database setelah Anda konfirmasi.
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
          ? ' · Nomor PFR sudah ada → simpan akan memperbarui klaim.'
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
        <h2 className="detail-block-title">Identitas & unit</h2>
        <div className="edit-grid">
          {(
            [
              ['claim_id', 'No. PFR (kosong = auto)'],
              ['model', 'Model'],
              ['serial_no', 'Serial'],
              ['engine_serial_no', 'Engine serial'],
              ['indent_no', 'Indent / build no'],
              ['customer', 'Customer'],
              ['branch', 'Cabang'],
              ['distributor', 'Distributor'],
              ['dealer_name', 'Dealer name'],
              ['dealer_code', 'Dealer code'],
              ['dealer_claim_no', 'No. klaim dealer'],
              ['dealer_wo_so', 'WO / SO'],
              ['app_code', 'App code'],
              ['sdlg_no', 'No. SDLG'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="field">
              <span>{label}</span>
              <input value={form[key] ?? ''} onChange={(e) => setF(key, e.target.value)} disabled={busy} />
            </label>
          ))}
        </div>

        <h2 className="detail-block-title">Tanggal & HM</h2>
        <div className="edit-grid">
          {(
            [
              ['sales_date', 'Tanggal jual'],
              ['failure_date', 'Tanggal gagal'],
              ['dealer_repair_date', 'Mulai perbaikan'],
              ['completion_date', 'Selesai perbaikan'],
              ['dealer_claim_date', 'Tanggal klaim dealer'],
              ['hm_failure', 'HM gagal'],
              ['hm_completion', 'HM selesai'],
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

        <h2 className="detail-block-title">Kerusakan & perbaikan</h2>
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
        <div className="edit-grid">
          {(
            [
              ['causing_part_no', 'Part no penyebab'],
              ['causing_part_desc', 'Deskripsi part'],
              ['failure_part_location', 'Lokasi part'],
              ['technical_personnel', 'Teknisi'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="field">
              <span>{label}</span>
              <input value={form[key] ?? ''} onChange={(e) => setF(key, e.target.value)} disabled={busy} />
            </label>
          ))}
        </div>

        <h2 className="detail-block-title">Biaya</h2>
        <div className="edit-grid">
          {(
            [
              ['labour_hrs', 'Labour (jam)'],
              ['mileage_km', 'Mileage (km)'],
              ['parts_total', 'Parts total'],
              ['total_amount', 'Total'],
              ['currency', 'Mata uang'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="field">
              <span>{label}</span>
              <input value={form[key] ?? ''} onChange={(e) => setF(key, e.target.value)} disabled={busy} />
            </label>
          ))}
        </div>

        {partsPreview && partsPreview.length > 0 && (
          <>
            <h2 className="detail-block-title">Parts ({partsPreview.length} baris) — ikut tersimpan</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Part no</th>
                    <th>Deskripsi</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {partsPreview.map((p, i) => (
                    <tr key={i}>
                      <td className="mono">{String(p.part_no ?? '—')}</td>
                      <td>{String(p.description ?? '—')}</td>
                      <td>{p.qty != null ? String(p.qty) : '—'}</td>
                      <td>{p.unit_price != null ? String(p.unit_price) : '—'}</td>
                      <td>{p.amount != null ? String(p.amount) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="muted small">
          Teks PFR asli juga disimpan di database (untuk jejak), bersama semua field di atas.
        </p>

        <div className="edit-actions">
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Menyimpan…' : existingId ? 'Update klaim (semua field)' : 'Simpan klaim baru (semua field)'}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => setStep('input')}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}

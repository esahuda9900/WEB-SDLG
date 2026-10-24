import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export type EditableClaimFields = {
  model: string | null
  serial_no: string | null
  engine_serial_no: string | null
  customer: string | null
  branch: string | null
  sdlg_no: string | null
  dealer_claim_no: string | null
  dealer_wo_so: string | null
  sales_date: string | null
  failure_date: string | null
  dealer_repair_date: string | null
  completion_date: string | null
  dealer_claim_date: string | null
  hm_failure: number | null
  hm_completion: number | null
  fault_description: string | null
  cause_analyze: string | null
  repair_method: string | null
  comment: string | null
  causing_part_no: string | null
  causing_part_desc: string | null
  failure_part_location: string | null
  technical_personnel: string | null
  working_conditions: string | null
  labour_hrs: number | null
  labour_rate: number | null
  labour_amount: number | null
  mileage_km: number | null
  mileage_rate: number | null
  mileage_amount: number | null
  other_amount: number | null
  parts_total: number | null
  total_amount: number | null
  currency: string | null
}

type Props = {
  claimUuid: string
  initial: EditableClaimFields
  onSaved: (next: EditableClaimFields & { last_updated: string }) => void
  onCancel: () => void
}

function str(v: string | null | undefined) {
  return v ?? ''
}

function numStr(v: number | null | undefined) {
  if (v === null || v === undefined) return ''
  return String(v)
}

function parseNum(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function parseDate(s: string): string | null {
  const t = s.trim()
  return t || null
}

export default function ClaimEditForm({ claimUuid, initial, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    model: str(initial.model),
    serial_no: str(initial.serial_no),
    engine_serial_no: str(initial.engine_serial_no),
    customer: str(initial.customer),
    branch: str(initial.branch),
    sdlg_no: str(initial.sdlg_no),
    dealer_claim_no: str(initial.dealer_claim_no),
    dealer_wo_so: str(initial.dealer_wo_so),
    sales_date: str(initial.sales_date),
    failure_date: str(initial.failure_date),
    dealer_repair_date: str(initial.dealer_repair_date),
    completion_date: str(initial.completion_date),
    dealer_claim_date: str(initial.dealer_claim_date),
    hm_failure: numStr(initial.hm_failure),
    hm_completion: numStr(initial.hm_completion),
    fault_description: str(initial.fault_description),
    cause_analyze: str(initial.cause_analyze),
    repair_method: str(initial.repair_method),
    comment: str(initial.comment),
    causing_part_no: str(initial.causing_part_no),
    causing_part_desc: str(initial.causing_part_desc),
    failure_part_location: str(initial.failure_part_location),
    technical_personnel: str(initial.technical_personnel),
    working_conditions: str(initial.working_conditions),
    labour_hrs: numStr(initial.labour_hrs),
    labour_rate: numStr(initial.labour_rate),
    labour_amount: numStr(initial.labour_amount),
    mileage_km: numStr(initial.mileage_km),
    mileage_rate: numStr(initial.mileage_rate),
    mileage_amount: numStr(initial.mileage_amount),
    other_amount: numStr(initial.other_amount),
    parts_total: numStr(initial.parts_total),
    total_amount: numStr(initial.total_amount),
    currency: str(initial.currency) || 'IDR',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const now = new Date().toISOString()
    const payload: EditableClaimFields & { last_updated: string } = {
      model: form.model.trim() || null,
      serial_no: form.serial_no.trim() || null,
      engine_serial_no: form.engine_serial_no.trim() || null,
      customer: form.customer.trim() || null,
      branch: form.branch.trim() || null,
      sdlg_no: form.sdlg_no.trim() || null,
      dealer_claim_no: form.dealer_claim_no.trim() || null,
      dealer_wo_so: form.dealer_wo_so.trim() || null,
      sales_date: parseDate(form.sales_date),
      failure_date: parseDate(form.failure_date),
      dealer_repair_date: parseDate(form.dealer_repair_date),
      completion_date: parseDate(form.completion_date),
      dealer_claim_date: parseDate(form.dealer_claim_date),
      hm_failure: parseNum(form.hm_failure),
      hm_completion: parseNum(form.hm_completion),
      fault_description: form.fault_description.trim() || null,
      cause_analyze: form.cause_analyze.trim() || null,
      repair_method: form.repair_method.trim() || null,
      comment: form.comment.trim() || null,
      causing_part_no: form.causing_part_no.trim() || null,
      causing_part_desc: form.causing_part_desc.trim() || null,
      failure_part_location: form.failure_part_location.trim() || null,
      technical_personnel: form.technical_personnel.trim() || null,
      working_conditions: form.working_conditions.trim() || null,
      labour_hrs: parseNum(form.labour_hrs),
      labour_rate: parseNum(form.labour_rate),
      labour_amount: parseNum(form.labour_amount),
      mileage_km: parseNum(form.mileage_km),
      mileage_rate: parseNum(form.mileage_rate),
      mileage_amount: parseNum(form.mileage_amount),
      other_amount: parseNum(form.other_amount),
      parts_total: parseNum(form.parts_total),
      total_amount: parseNum(form.total_amount),
      currency: form.currency.trim() || null,
      last_updated: now,
    }

    const { error: err } = await supabase.from('claims').update(payload).eq('id', claimUuid)
    setSaving(false)

    if (err) {
      setError(err.message)
      return
    }
    onSaved(payload)
  }

  return (
    <form className="card detail-block edit-form" onSubmit={onSubmit}>
      <h2 className="detail-block-title">Edit data klaim</h2>

      <h3 className="edit-section">Unit & customer</h3>
      <div className="edit-grid">
        <label className="field">
          <span>Model</span>
          <input value={form.model} onChange={(e) => set('model', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Serial</span>
          <input value={form.serial_no} onChange={(e) => set('serial_no', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Engine serial</span>
          <input value={form.engine_serial_no} onChange={(e) => set('engine_serial_no', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Customer</span>
          <input value={form.customer} onChange={(e) => set('customer', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Cabang</span>
          <input value={form.branch} onChange={(e) => set('branch', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>No. SDLG</span>
          <input value={form.sdlg_no} onChange={(e) => set('sdlg_no', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>No. klaim dealer</span>
          <input value={form.dealer_claim_no} onChange={(e) => set('dealer_claim_no', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>WO / SO</span>
          <input value={form.dealer_wo_so} onChange={(e) => set('dealer_wo_so', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>HM gagal</span>
          <input value={form.hm_failure} onChange={(e) => set('hm_failure', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>HM selesai</span>
          <input value={form.hm_completion} onChange={(e) => set('hm_completion', e.target.value)} disabled={saving} />
        </label>
      </div>

      <h3 className="edit-section">Tanggal</h3>
      <div className="edit-grid">
        {(
          [
            ['sales_date', 'Tanggal jual'],
            ['failure_date', 'Tanggal gagal'],
            ['dealer_repair_date', 'Mulai perbaikan'],
            ['completion_date', 'Selesai perbaikan'],
            ['dealer_claim_date', 'Tanggal klaim dealer'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field">
            <span>{label}</span>
            <input
              type="date"
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              disabled={saving}
            />
          </label>
        ))}
      </div>

      <h3 className="edit-section">Kerusakan & perbaikan</h3>
      <label className="field">
        <span>Deskripsi kerusakan</span>
        <textarea
          className="textarea"
          rows={3}
          value={form.fault_description}
          onChange={(e) => set('fault_description', e.target.value)}
          disabled={saving}
        />
      </label>
      <label className="field">
        <span>Analisis penyebab</span>
        <textarea
          className="textarea"
          rows={3}
          value={form.cause_analyze}
          onChange={(e) => set('cause_analyze', e.target.value)}
          disabled={saving}
        />
      </label>
      <label className="field">
        <span>Metode perbaikan</span>
        <textarea
          className="textarea"
          rows={2}
          value={form.repair_method}
          onChange={(e) => set('repair_method', e.target.value)}
          disabled={saving}
        />
      </label>
      <label className="field">
        <span>Komentar</span>
        <textarea
          className="textarea"
          rows={2}
          value={form.comment}
          onChange={(e) => set('comment', e.target.value)}
          disabled={saving}
        />
      </label>

      <div className="edit-grid">
        <label className="field">
          <span>Part no penyebab</span>
          <input value={form.causing_part_no} onChange={(e) => set('causing_part_no', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Deskripsi part</span>
          <input value={form.causing_part_desc} onChange={(e) => set('causing_part_desc', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Lokasi</span>
          <input value={form.failure_part_location} onChange={(e) => set('failure_part_location', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Teknisi</span>
          <input value={form.technical_personnel} onChange={(e) => set('technical_personnel', e.target.value)} disabled={saving} />
        </label>
        <label className="field">
          <span>Kondisi kerja</span>
          <input value={form.working_conditions} onChange={(e) => set('working_conditions', e.target.value)} disabled={saving} />
        </label>
      </div>

      <h3 className="edit-section">Biaya</h3>
      <div className="edit-grid">
        {(
          [
            ['currency', 'Mata uang'],
            ['labour_hrs', 'Labour (jam)'],
            ['labour_rate', 'Labour rate'],
            ['labour_amount', 'Labour amount'],
            ['mileage_km', 'Mileage km'],
            ['mileage_rate', 'Mileage rate'],
            ['mileage_amount', 'Mileage amount'],
            ['other_amount', 'Other'],
            ['parts_total', 'Parts total'],
            ['total_amount', 'Total'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field">
            <span>{label}</span>
            <input value={form[key]} onChange={(e) => set(key, e.target.value)} disabled={saving} />
          </label>
        ))}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="edit-actions">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan data'}
        </button>
        <button type="button" className="btn" disabled={saving} onClick={onCancel}>
          Batal
        </button>
      </div>
    </form>
  )
}

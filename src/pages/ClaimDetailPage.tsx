import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toDisplayStatus } from '../lib/claimStatus'

type ClaimDetail = {
  id: string
  claim_id: string
  claim_type: string | null
  claim_status: string | null
  repair_status: string | null
  model: string | null
  serial_no: string | null
  engine_serial_no: string | null
  customer: string | null
  branch: string | null
  dealer_name: string | null
  distributor: string | null
  sdlg_no: string | null
  dealer_claim_no: string | null
  dealer_wo_so: string | null
  sdlg_submission_no: string | null
  sales_date: string | null
  failure_date: string | null
  dealer_repair_date: string | null
  completion_date: string | null
  dealer_claim_date: string | null
  input_date: string | null
  status_date: string | null
  sdlg_audit_date: string | null
  sdlg_approval_date: string | null
  billing_date: string | null
  invoice_no: string | null
  invoice_date: string | null
  payment_date: string | null
  payment_amount: number | null
  hm_failure: number | null
  hm_completion: number | null
  fault_description: string | null
  cause_analyze: string | null
  comment: string | null
  causing_part_no: string | null
  causing_part_desc: string | null
  failure_part_location: string | null
  repair_method: string | null
  technical_personnel: string | null
  working_conditions: string | null
  rejection_reason: string | null
  status_update_reason: string | null
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
  parts: unknown
  photo_count: number | null
  archived_at: string | null
  last_updated: string | null
  created_at: string | null
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function fmtMoney(n: number | null | undefined, currency: string | null) {
  if (n === null || n === undefined) return '—'
  const cur = currency || 'IDR'
  return `${cur} ${Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-field">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value ?? '—'}</div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card detail-block">
      <h2 className="detail-block-title">{title}</h2>
      <div className="detail-grid">{children}</div>
    </section>
  )
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  return (
    <section className="card detail-block">
      <h2 className="detail-block-title">{title}</h2>
      <p className="detail-text">{text?.trim() ? text : '—'}</p>
    </section>
  )
}

function PartsTable({ parts }: { parts: unknown }) {
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    return <p className="muted small">Tidak ada data parts.</p>
  }
  return (
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
          {parts.map((p: Record<string, unknown>, i: number) => (
            <tr key={i}>
              <td className="mono">{String(p.part_no ?? p.partNo ?? p.part_number ?? '—')}</td>
              <td>{String(p.description ?? p.desc ?? p.part_desc ?? '—')}</td>
              <td>{String(p.qty ?? p.quantity ?? '—')}</td>
              <td>{p.unit_price != null ? String(p.unit_price) : p.price != null ? String(p.price) : '—'}</td>
              <td>{p.amount != null ? String(p.amount) : p.total != null ? String(p.total) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ClaimDetailPage() {
  const { claimId } = useParams()
  const [row, setRow] = useState<ClaimDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!claimId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('claims')
        .select(
          `
          id, claim_id, claim_type, claim_status, repair_status,
          model, serial_no, engine_serial_no, customer, branch, dealer_name, distributor,
          sdlg_no, dealer_claim_no, dealer_wo_so, sdlg_submission_no,
          sales_date, failure_date, dealer_repair_date, completion_date, dealer_claim_date,
          input_date, status_date, sdlg_audit_date, sdlg_approval_date,
          billing_date, invoice_no, invoice_date, payment_date, payment_amount,
          hm_failure, hm_completion,
          fault_description, cause_analyze, comment,
          causing_part_no, causing_part_desc, failure_part_location,
          repair_method, technical_personnel, working_conditions,
          rejection_reason, status_update_reason,
          labour_hrs, labour_rate, labour_amount,
          mileage_km, mileage_rate, mileage_amount,
          other_amount, parts_total, total_amount, currency,
          parts, photo_count, archived_at, last_updated, created_at
        `,
        )
        .eq('claim_id', claimId)
        .maybeSingle()

      if (cancelled) return
      if (err) {
        setError(err.message)
        setRow(null)
      } else if (!data) {
        setError('Klaim tidak ditemukan atau tidak ada akses.')
        setRow(null)
      } else {
        setRow(data as ClaimDetail)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [claimId])

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Memuat detail klaim…</p>
      </div>
    )
  }

  if (error || !row) {
    return (
      <div className="page">
        <p className="muted small">
          <Link to="/klaim">← Kembali ke daftar</Link>
        </p>
        <div className="alert alert-error" role="alert">
          {error ?? 'Data tidak tersedia'}
        </div>
      </div>
    )
  }

  const display = toDisplayStatus(row.claim_status, row.archived_at)

  return (
    <div className="page page-wide">
      <p className="muted small">
        <Link to="/klaim">← Kembali ke daftar</Link>
      </p>

      <div className="detail-header">
        <div>
          <h1 className="mono">{row.claim_id}</h1>
          <p className="muted">
            Status DB: <strong>{row.claim_status ?? '—'}</strong>
            {row.repair_status ? ` · Repair: ${row.repair_status}` : ''}
          </p>
        </div>
        <span className={`status-pill status-${slug(display)}`}>{display}</span>
      </div>

      {row.rejection_reason && (
        <div className="alert alert-error" role="status">
          <strong>Alasan ditolak:</strong> {row.rejection_reason}
        </div>
      )}

      <Block title="Identitas & unit">
        <Field label="Model" value={row.model} />
        <Field label="Serial" value={<span className="mono">{row.serial_no ?? '—'}</span>} />
        <Field label="Engine serial" value={<span className="mono">{row.engine_serial_no ?? '—'}</span>} />
        <Field label="Customer" value={row.customer} />
        <Field label="Cabang" value={row.branch} />
        <Field label="Dealer" value={row.dealer_name ?? row.distributor} />
        <Field label="No. SDLG" value={<span className="mono">{row.sdlg_no ?? '—'}</span>} />
        <Field label="No. klaim dealer" value={row.dealer_claim_no} />
        <Field label="WO / SO" value={row.dealer_wo_so} />
        <Field label="Tipe klaim" value={row.claim_type} />
        <Field label="HM saat gagal" value={fmtNum(row.hm_failure)} />
        <Field label="HM selesai" value={fmtNum(row.hm_completion)} />
      </Block>

      <Block title="Tanggal penting">
        <Field label="Tanggal jual" value={fmtDate(row.sales_date)} />
        <Field label="Tanggal gagal" value={fmtDate(row.failure_date)} />
        <Field label="Mulai perbaikan" value={fmtDate(row.dealer_repair_date)} />
        <Field label="Selesai perbaikan" value={fmtDate(row.completion_date)} />
        <Field label="Tanggal klaim dealer" value={fmtDate(row.dealer_claim_date)} />
        <Field label="Input" value={fmtDate(row.input_date)} />
        <Field label="Status date" value={fmtDate(row.status_date)} />
        <Field label="Audit SDLG" value={fmtDate(row.sdlg_audit_date)} />
        <Field label="Approval SDLG" value={fmtDate(row.sdlg_approval_date)} />
        <Field label="Billing" value={fmtDate(row.billing_date)} />
        <Field label="Invoice" value={row.invoice_no ? `${row.invoice_no} (${fmtDate(row.invoice_date)})` : fmtDate(row.invoice_date)} />
        <Field label="Pembayaran" value={row.payment_date ? `${fmtDate(row.payment_date)} · ${fmtMoney(row.payment_amount, row.currency)}` : '—'} />
      </Block>

      <TextBlock title="Deskripsi kerusakan" text={row.fault_description} />
      <TextBlock title="Analisis penyebab" text={row.cause_analyze} />
      <TextBlock title="Metode perbaikan" text={row.repair_method} />
      <TextBlock title="Komentar" text={row.comment} />

      <Block title="Part penyebab & kondisi">
        <Field label="Part no" value={<span className="mono">{row.causing_part_no ?? '—'}</span>} />
        <Field label="Deskripsi part" value={row.causing_part_desc} />
        <Field label="Lokasi" value={row.failure_part_location} />
        <Field label="Kondisi kerja" value={row.working_conditions} />
        <Field label="Teknisi" value={row.technical_personnel} />
        <Field label="Jumlah foto" value={row.photo_count != null ? String(row.photo_count) : '—'} />
      </Block>

      <Block title="Biaya">
        <Field label="Labour (jam)" value={fmtNum(row.labour_hrs, 1)} />
        <Field label="Labour rate" value={fmtMoney(row.labour_rate, row.currency)} />
        <Field label="Labour amount" value={fmtMoney(row.labour_amount, row.currency)} />
        <Field label="Mileage (km)" value={fmtNum(row.mileage_km)} />
        <Field label="Mileage rate" value={fmtMoney(row.mileage_rate, row.currency)} />
        <Field label="Mileage amount" value={fmtMoney(row.mileage_amount, row.currency)} />
        <Field label="Other" value={fmtMoney(row.other_amount, row.currency)} />
        <Field label="Parts total" value={fmtMoney(row.parts_total, row.currency)} />
        <Field label="Total" value={<strong>{fmtMoney(row.total_amount, row.currency)}</strong>} />
      </Block>

      <section className="card detail-block">
        <h2 className="detail-block-title">Parts</h2>
        <PartsTable parts={row.parts} />
      </section>

      {(row.status_update_reason || row.sdlg_submission_no) && (
        <Block title="Catatan status / SDLG">
          <Field label="No. submission SDLG" value={row.sdlg_submission_no} />
          <Field label="Alasan update status" value={row.status_update_reason} />
        </Block>
      )}

      <p className="muted small">
        Dibuat: {fmtDate(row.created_at)} · Diperbarui: {fmtDate(row.last_updated)}
        {row.archived_at ? ` · Diarsipkan: ${fmtDate(row.archived_at)}` : ''}
      </p>
    </div>
  )
}

function slug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-')
}

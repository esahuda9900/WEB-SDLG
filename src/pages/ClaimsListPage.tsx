import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  DISPLAY_STATUS_OPTIONS,
  dbStatusesForDisplay,
  toDisplayStatus,
  type DisplayStatus,
} from '../lib/claimStatus'

type ClaimRow = {
  id: string
  claim_id: string
  claim_status: string | null
  model: string | null
  serial_no: string | null
  customer: string | null
  sdlg_no: string | null
  failure_date: string | null
  dealer_claim_date: string | null
  last_updated: string | null
  archived_at: string | null
}

type Tab = 'aktif' | 'arsip'

const PAGE_SIZE = 20
const EXPORT_LIMIT = 2000

function formatDate(d: string | null) {
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

function csvEscape(v: string) {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

function buildClaimsQuery(
  tab: Tab,
  statusFilter: DisplayStatus | 'Semua',
  searchApplied: string,
) {
  let q = supabase
    .from('claims')
    .select(
      'id, claim_id, claim_status, model, serial_no, customer, sdlg_no, failure_date, dealer_claim_date, last_updated, archived_at',
      { count: 'exact' },
    )

  if (tab === 'arsip') {
    q = q.not('archived_at', 'is', null)
  } else {
    q = q.is('archived_at', null)
    if (statusFilter !== 'Semua') {
      const statuses = dbStatusesForDisplay(statusFilter)
      if (statuses && statuses.length) {
        q = q.in('claim_status', statuses)
      }
    }
  }

  const term = searchApplied.trim()
  if (term) {
    q = q.or(
      `claim_id.ilike.%${term}%,sdlg_no.ilike.%${term}%,serial_no.ilike.%${term}%`,
    )
  }

  return q.order('last_updated', { ascending: false, nullsFirst: false })
}

function downloadCsv(rows: ClaimRow[], tab: Tab) {
  const headers = [
    'No',
    'No. PFR',
    'Status tampilan',
    'Status DB',
    'Model',
    'Serial',
    'Customer',
    'No. SDLG',
    'Tgl gagal',
    'Tgl klaim dealer',
    'Terakhir update',
    'Arsip',
  ]
  const lines = [headers.join(',')]
  rows.forEach((r, i) => {
    const display = toDisplayStatus(r.claim_status, r.archived_at)
    const cells = [
      String(i + 1),
      r.claim_id,
      display,
      r.claim_status ?? '',
      r.model ?? '',
      r.serial_no ?? '',
      r.customer ?? '',
      r.sdlg_no ?? '',
      r.failure_date ?? '',
      r.dealer_claim_date ?? '',
      r.last_updated ?? '',
      r.archived_at ? 'ya' : 'tidak',
    ].map((c) => csvEscape(String(c)))
    lines.push(cells.join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `klaim-sdlg-${tab}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ClaimsListPage() {
  const [tab, setTab] = useState<Tab>('aktif')
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'Semua'>('Semua')
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<ClaimRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const q = buildClaimsQuery(tab, statusFilter, searchApplied).range(
      page * PAGE_SIZE,
      page * PAGE_SIZE + PAGE_SIZE - 1,
    )

    const { data, error: err, count } = await q

    if (err) {
      setError(err.message)
      setRows([])
      setTotal(0)
    } else {
      setRows((data as ClaimRow[]) ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [tab, statusFilter, searchApplied, page])

  useEffect(() => {
    void load()
  }, [load])

  function applySearch(e: FormEvent) {
    e.preventDefault()
    setPage(0)
    setSearchApplied(search)
  }

  function changeTab(t: Tab) {
    setTab(t)
    setPage(0)
    setStatusFilter('Semua')
  }

  async function exportCsv() {
    setExporting(true)
    setExportMsg(null)
    setError(null)
    try {
      const { data, error: err } = await buildClaimsQuery(
        tab,
        statusFilter,
        searchApplied,
      ).range(0, EXPORT_LIMIT - 1)

      if (err) {
        setError(`Export gagal: ${err.message}`)
        setExporting(false)
        return
      }
      const list = (data as ClaimRow[]) ?? []
      if (list.length === 0) {
        setExportMsg('Tidak ada data untuk diexport.')
        setExporting(false)
        return
      }
      downloadCsv(list, tab)
      setExportMsg(
        list.length >= EXPORT_LIMIT
          ? `CSV diunduh (maks. ${EXPORT_LIMIT} baris).`
          : `CSV diunduh (${list.length} baris).`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export gagal')
    }
    setExporting(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const fromNo = total === 0 ? 0 : page * PAGE_SIZE + 1
  const toNo = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="page page-wide">
      <div className="page-head" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1>Daftar klaim</h1>
          <p className="muted">Cari, filter, export, dan buka detail klaim warranty</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button type="button" className="btn" disabled={exporting || loading} onClick={() => void exportCsv()}>
            {exporting ? 'Export…' : 'Export CSV'}
          </button>
          <Link className="btn primary" to="/klaim/baru">
            + Klaim baru
          </Link>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={tab === 'aktif' ? 'tab active' : 'tab'}
          onClick={() => changeTab('aktif')}
        >
          Aktif
        </button>
        <button
          type="button"
          className={tab === 'arsip' ? 'tab active' : 'tab'}
          onClick={() => changeTab('arsip')}
        >
          Arsip
        </button>
      </div>

      <form className="toolbar card" onSubmit={applySearch}>
        <input
          className="search-input"
          type="search"
          placeholder="Cari nomor PFR, SDLG, atau serial…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {tab === 'aktif' && (
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as DisplayStatus | 'Semua')
              setPage(0)
            }}
          >
            <option value="Semua">Semua status</option>
            {DISPLAY_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="btn primary">
          Cari
        </button>
      </form>

      {exportMsg && (
        <div className="alert alert-ok" role="status">
          {exportMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          Gagal memuat data: {error}
        </div>
      )}

      {loading && (
        <div className="card">
          <p className="muted">Memuat daftar klaim…</p>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="card empty-state">
          <p>
            <strong>Tidak ada klaim</strong>
          </p>
          <p className="muted small">
            Coba ubah filter atau kata kunci pencarian.
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="table-wrap card">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-no">No</th>
                  <th>No. PFR</th>
                  <th>Status</th>
                  <th>Model</th>
                  <th>Serial</th>
                  <th>Customer</th>
                  <th>No. SDLG</th>
                  <th>Tgl gagal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const no = page * PAGE_SIZE + i + 1
                  const display = toDisplayStatus(r.claim_status, r.archived_at)
                  return (
                    <tr key={r.id}>
                      <td className="col-no muted">{no}</td>
                      <td>
                        <Link className="claim-link" to={`/klaim/${encodeURIComponent(r.claim_id)}`}>
                          {r.claim_id}
                        </Link>
                      </td>
                      <td>
                        <span className={`status-pill status-${slug(display)}`}>
                          {display}
                        </span>
                      </td>
                      <td>{r.model ?? '—'}</td>
                      <td className="mono">{r.serial_no ?? '—'}</td>
                      <td>{r.customer ?? '—'}</td>
                      <td className="mono">{r.sdlg_no ?? '—'}</td>
                      <td>{formatDate(r.failure_date)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <span className="muted small">
              Menampilkan {fromNo}–{toNo} dari {total}
            </span>
            <div className="pager-btns">
              <button
                type="button"
                className="btn"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Sebelumnya
              </button>
              <span className="muted small">
                Halaman {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function slug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-')
}

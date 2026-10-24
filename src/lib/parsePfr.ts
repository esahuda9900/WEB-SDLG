import { supabase } from './supabase'

export type ParsedPfr = {
  claimType?: string | null
  sdlgNo?: string | null
  distributorNo?: string | null
  dealerWoSo?: string | null
  appCode?: string | null
  model?: string | null
  serialNo?: string | null
  indentNo?: string | null
  hmFailure?: number | null
  hmCompletion?: number | null
  distributor?: string | null
  dealerCode?: string | null
  dealerClaimNo?: string | null
  customer?: string | null
  branch?: string | null
  dealerName?: string | null
  salesDate?: string | null
  failureDate?: string | null
  dealerRepairDate?: string | null
  completionDate?: string | null
  dealerClaimDate?: string | null
  repairStatus?: string | null
  faultDescription?: string | null
  causeAnalyze?: string | null
  comment?: string | null
  causingPartNo?: string | null
  causingPartDesc?: string | null
  repairMethod?: string | null
  technicalPersonnel?: string | null
  engineSerialNo?: string | null
  failurePartLocation?: string | null
  mileageToSite?: number | null
  labourHrs?: number | null
  labourRate?: number | null
  mileageKm?: number | null
  mileageRate?: number | null
  otherAmount?: number | null
  currency?: string | null
  parts?: unknown
  photoLabels?: string[] | null
}

export type ParseResult = {
  data: ParsedPfr
  model: string
  warning?: string
}

function clean(v: unknown) {
  return String(v ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/^[\s"']+|[\s"']+$/g, '')
    .trim()
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  let s = String(v).replace(/[^0-9,.-]/g, '')
  if (!s) return null
  const c = s.lastIndexOf(','),
    d = s.lastIndexOf('.')
  if (c >= 0 && d >= 0) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  else if (c >= 0) s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

function dateIso(v: unknown): string | null {
  const s = clean(v)
  if (!s) return null
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    let y = m[3]
    if (y.length === 2) y = '20' + y
    const out = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    const dt = new Date(`${out}T00:00:00Z`)
    return dt.getUTCFullYear() === Number(y) &&
      dt.getUTCMonth() + 1 === Number(m[2]) &&
      dt.getUTCDate() === Number(m[1])
      ? out
      : null
  }
  m = s.match(/^(\d{1,2})[\-\s]+([A-Za-z]{3,9})[\-\s]+(\d{4})$/)
  if (m) {
    const mm = MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (!mm) return null
    const out = `${m[3]}-${String(mm).padStart(2, '0')}-${m[1].padStart(2, '0')}`
    return out
  }
  return null
}

/** Ambil nilai setelah label (tab, spasi, atau baris berikutnya). */
function afterLabel(raw: string, labels: string[]): string | null {
  for (const label of labels) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Label lalu tab/spasi lalu nilai di baris yang sama
    let re = new RegExp(esc + '\\s*[:]?\\s*[\t ]+([^\n\r\t]+)', 'i')
    let m = raw.match(re)
    if (m) {
      const v = clean(m[1])
      if (v && !/^(Signature|Date|Customer)\b/i.test(v)) return v
    }
    // Label di akhir sel, nilai di token berikutnya (banyak spasi)
    re = new RegExp(esc + '\\s*[:]?\\s+([^\n\r]{1,120})', 'i')
    m = raw.match(re)
    if (m) {
      const v = clean(m[1].split(/\t{2,}|\s{2,}/)[0])
      if (v && v.length < 120) return v
    }
  }
  return null
}

function blockAfter(raw: string, labels: string[], stopLabels: string[]): string | null {
  for (const label of labels) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(esc + '\\s*[:]?\\s*["\s]*([\\s\\S]{1,2000}?)(?=' +
      stopLabels.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
      '|$)', 'i')
    const m = raw.match(re)
    if (m) {
      const v = clean(m[1].replace(/"/g, ' '))
      if (v.length > 3) return v
    }
  }
  return null
}

/** Parse lokal tangguh — tidak hanya mengandalkan tab Excel. */
export function parsePfrLocal(rawText: string): ParsedPfr {
  const raw = rawText.replace(/\u00a0/g, ' ')
  const p: ParsedPfr = {}

  p.distributorNo = afterLabel(raw, ['Distributor No'])
  p.sdlgNo = afterLabel(raw, ['SDLG No'])
  p.dealerWoSo = afterLabel(raw, ['Dealer WO/SO', 'Dealer WO'])
  p.appCode = afterLabel(raw, ['App. Code', 'App Code'])
  p.model = afterLabel(raw, ['Product Name (Model)'])
  p.hmFailure = num(afterLabel(raw, ['Working Hours (Hour Meter Reading)', 'Working Hours']))
  p.distributor = afterLabel(raw, ['Distributor'])
  p.indentNo = afterLabel(raw, [
    'Indent No. (Machine Build No.)',
    'Indent No (Machine Build No)',
    'Indent No.',
  ])
  p.salesDate = dateIso(afterLabel(raw, ['Sales Date (DD/MM/YY)', 'Sales Date']))
  p.customer = afterLabel(raw, ['Customer Name'])
  p.serialNo = afterLabel(raw, ['Serial No.', 'Serial No'])
  p.failureDate = dateIso(afterLabel(raw, ['Failure Date']))
  p.dealerName = afterLabel(raw, ['Contact Info (Dealer Name)', 'Dealer Name'])
  p.dealerCode = afterLabel(raw, ['Dealer Code'])
  p.dealerClaimNo = afterLabel(raw, ['Dealer Claim No.', 'Dealer Claim No'])
  p.dealerRepairDate = dateIso(
    afterLabel(raw, ['Dealer  Repair Date', 'Dealer Repair Date']),
  )
  p.dealerClaimDate = dateIso(afterLabel(raw, ['Dealer  Claim Date', 'Dealer Claim Date']))
  p.faultDescription = afterLabel(raw, ['Fault Description'])
  p.causeAnalyze = blockAfter(
    raw,
    ['Cause Analyze (Cause of Failure)', 'Cause Analyze'],
    ['Comment', 'Causing Part Number', 'Handling Result'],
  )
  p.comment = blockAfter(raw, ['Comment'], ['Causing Part Number', 'Handling Result'])
  const cp = afterLabel(raw, ['Causing Part Number (Description)', 'Causing Part Number'])
  if (cp) {
    const m = cp.match(/^(\S+)\s*\((.+)\)\s*$/)
    if (m) {
      p.causingPartNo = m[1]
      p.causingPartDesc = m[2]
    } else p.causingPartNo = cp
  }
  p.repairMethod = blockAfter(
    raw,
    ['Handling Result (Repair Method)', 'Handling Result'],
    ['Customer', 'Signature', 'Part Replacement', 'Repairs Completion'],
  )
  p.technicalPersonnel = afterLabel(raw, [
    'Signature of Technical Personnel:',
    'Signature of Technical Personnel',
    'Technical Personnel',
  ])
  p.completionDate = dateIso(
    afterLabel(raw, ['Repairs Completion Date:', 'Repairs Completion Date']),
  )

  const fin = raw.match(/Finish Hour Meter\s*\(([^)]+)\)/i)
  if (fin) p.hmCompletion = num(fin[1])
  const eng = raw.match(/Engine Name Plate\s*\((?:SN\.?\s*)?([^)]+)\)/i)
  if (eng) p.engineSerialNo = clean(eng[1])
  const floc = raw.match(/Failure Part Location\s*\(([^)]+)\)/i)
  if (floc) p.failurePartLocation = clean(floc[1])
  const mts = raw.match(/Mil(?:e|l)age To Site\s*=\s*([0-9.,]+)/i)
  if (mts) {
    p.mileageToSite = num(mts[1])
    p.mileageKm = p.mileageToSite
  }

  // Labour hrs: angka setelah "Labour" ... "Hrs"
  const lab = raw.match(/Labour[\s\S]{0,80}?Hrs[\s\t]*([0-9]+(?:[.,][0-9]+)?)/i)
  if (lab) p.labourHrs = num(lab[1])
  const mil = raw.match(/Mileage[\s\S]{0,80}?Km[\s\t]*([0-9]+(?:[.,][0-9]+)?)/i)
  if (mil) p.mileageKm = num(mil[1])

  if (/\bUSD\b/i.test(raw)) p.currency = 'USD'
  else if (/\bIDR\b|\bRP\b/i.test(raw)) p.currency = 'IDR'

  p.parts = parsePartsLocal(raw)
  if (p.completionDate) p.repairStatus = 'Repair Completed'

  return p
}

function parsePartsLocal(raw: string): Record<string, unknown>[] {
  const lines = raw.split(/\r?\n/)
  const out: Record<string, unknown>[] = []
  // Baris part: dua kode SLG-... lalu deskripsi lalu qty
  const partLine =
    /\b(SLG[-\s]?[0-9A-Z]+)\b[\s\t]+\b(SLG[-\s]?[0-9A-Z]+)\b[\s\t]+([^\t\n]+?)[\s\t]+([0-9]+(?:[.,][0-9]+)?)[\s\t]+([0-9.,]*)[\s\t]*([0-9.,]*)/i
  const partLineLoose =
    /\b(SLG[-\s]?[0-9A-Z]+)\b[\s\t]+\b(SLG[-\s]?[0-9A-Z]+)\b[\s\t]+([A-Za-z][^\t\n]{1,60}?)[\s\t]+([0-9]+)/i

  for (const line of lines) {
    if (/PARTS TOTAL|Copy last row/i.test(line)) break
    let m = line.match(partLine)
    if (!m) m = line.match(partLineLoose)
    if (!m) continue
    const failure = clean(m[1]).replace(/\s+/g, '')
    const replacement = clean(m[2]).replace(/\s+/g, '')
    const description = clean(m[3])
    const qty = num(m[4])
    const unitPrice = m[5] != null ? num(m[5]) : null
    const amount = m[6] != null ? num(m[6]) : unitPrice != null && qty != null ? qty * unitPrice : null
    if (!failure && !replacement) continue
    out.push({
      failurePartNo: failure,
      replacementPartNo: replacement,
      description: /^(Sealing|O-Ring|Plate|AC |Kit|Pump)/i.test(description)
        ? description
        : description,
      qty,
      unitPrice,
      amount,
    })
  }

  // Fallback: daftar SLG di bagian Part Replacement
  if (out.length === 0) {
    const section = raw.split(/Part Replacement Record/i)[1] || ''
    const codes = [...section.matchAll(/\b(SLG[-]?[0-9A-Z]+)\b/gi)].map((x) =>
      x[1].replace(/\s+/g, ''),
    )
    // Pasangkan berdua (failure, replacement) unik
    for (let i = 0; i + 1 < codes.length && out.length < 20; i += 2) {
      if (codes[i] === codes[i + 1] || true) {
        out.push({
          failurePartNo: codes[i],
          replacementPartNo: codes[i + 1] || codes[i],
          description: null,
          qty: 1,
          unitPrice: null,
          amount: null,
        })
      }
    }
  }
  return out
}

function mergeParsed(a: ParsedPfr, b: ParsedPfr): ParsedPfr {
  const out: ParsedPfr = { ...a }
  for (const [k, v] of Object.entries(b) as [keyof ParsedPfr, ParsedPfr[keyof ParsedPfr]][]) {
    if (v === null || v === undefined || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    const cur = out[k]
    if (cur === null || cur === undefined || cur === '') {
      ;(out as Record<string, unknown>)[k] = v
    } else if (Array.isArray(v) && Array.isArray(cur) && cur.length === 0) {
      ;(out as Record<string, unknown>)[k] = v
    }
  }
  // Parts: pilih yang lebih lengkap
  const ap = Array.isArray(a.parts) ? a.parts : []
  const bp = Array.isArray(b.parts) ? b.parts : []
  if (bp.length > ap.length) out.parts = bp
  else if (ap.length && !bp.length) out.parts = ap
  else if (bp.length) {
    // Prefer rows that have description
    const score = (parts: unknown[]) =>
      parts.filter((x) => x && typeof x === 'object' && (x as { description?: string }).description)
        .length
    out.parts = score(bp) >= score(ap) ? bp : ap
  }
  return out
}

export function enrichFromRaw(p: ParsedPfr, raw: string): ParsedPfr {
  return mergeParsed(p, parsePfrLocal(raw))
}

export function normalizeParts(parts: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(parts) || parts.length === 0) return null
  return parts.map((p: Record<string, unknown>) => {
    const failure = p.failurePartNo ?? p.failure_part_no ?? null
    const replacement = p.replacementPartNo ?? p.replacement_part_no ?? p.part_no ?? failure
    let description = p.description != null ? String(p.description).trim() : null
    // Perbaiki salah kolom: description yang sebenarnya part number
    if (description && /^SLG[-]?\d+/i.test(description) && !replacement) {
      // swapped
    }
    if (description && /^SLG[-]?\d+/i.test(description)) {
      // description is part code — likely misaligned; keep as part, clear desc if no real text
      if (!/[A-Za-z]{3,}/.test(description.replace(/SLG[-\d\s]/gi, ''))) {
        description = null
      }
    }
    const qty = num(p.qty ?? p.quantity)
    const unitPrice = num(p.unitPrice ?? p.unit_price ?? p.price)
    let amount = num(p.amount ?? p.total)
    // Jika unit_price keliru dapat qty (mis. 1) dan amount kosong
    if (amount == null && qty != null && unitPrice != null && unitPrice !== qty) {
      amount = qty * unitPrice
    }
    return {
      part_no: replacement != null ? String(replacement).trim().replace(/\s+/g, '') : null,
      failure_part_no: failure != null ? String(failure).trim().replace(/\s+/g, '') : null,
      description,
      qty,
      unit_price: unitPrice,
      amount,
    }
  })
}

export function sumPartsAmount(parts: Record<string, unknown>[] | null): number | null {
  if (!parts?.length) return null
  let t = 0
  let any = false
  for (const p of parts) {
    const a = num(p.amount)
    if (a != null) {
      t += a
      any = true
    }
  }
  return any ? t : null
}

export async function invokeParsePfr(rawText: string): Promise<ParseResult> {
  const local = parsePfrLocal(rawText)
  let remote: ParsedPfr = {}
  let model = 'local-parser'
  let warning: string | undefined

  try {
    const { data, error } = await supabase.functions.invoke('gemini-parse-claim', {
      body: { rawText },
    })
    if (error) {
      warning = error.message || 'Parser server gagal; memakai parser lokal.'
    } else if (data?.error) {
      warning = String(data.error)
    } else {
      remote = (data?.data ?? {}) as ParsedPfr
      model = String(data?.model ?? 'server')
      if (data?.warning) warning = String(data.warning)
    }
  } catch (e) {
    warning = e instanceof Error ? e.message : 'Parser server tidak terjangkau; memakai parser lokal.'
  }

  const merged = enrichFromRaw(mergeParsed(remote, local), rawText)
  // Jika field inti masih kosong, pastikan model tercatat local
  if (!merged.model && !merged.serialNo) {
    model = 'local-parser'
  } else if (model.startsWith('source-parser') && merged.model) {
    // ok
  }

  return { data: merged, model: `${model}+local`, warning }
}

export function parsedToClaimRow(p: ParsedPfr, rawText: string) {
  const claimId =
    (p.distributorNo && /SDLG-PFR/i.test(p.distributorNo) ? p.distributorNo.trim() : null) ||
    (p.sdlgNo && /SDLG-PFR/i.test(p.sdlgNo) ? p.sdlgNo.trim() : null)

  const parts = normalizeParts(p.parts)
  const partsTotal = sumPartsAmount(parts)
  const labourHrs = p.labourHrs ?? null
  const labourRate = p.labourRate ?? null
  const labourAmount =
    labourHrs != null && labourRate != null ? labourHrs * labourRate : null
  const mileageKm = p.mileageKm ?? p.mileageToSite ?? null
  const mileageRate = p.mileageRate ?? null
  const mileageAmount =
    mileageKm != null && mileageRate != null ? mileageKm * mileageRate : null
  const otherAmount = p.otherAmount ?? null
  let total: number | null = null
  for (const x of [partsTotal, labourAmount, mileageAmount, otherAmount]) {
    if (x != null) total = (total ?? 0) + x
  }

  return {
    claim_id_candidate: claimId,
    model: p.model ?? null,
    serial_no: p.serialNo ?? null,
    engine_serial_no: p.engineSerialNo ?? null,
    indent_no: p.indentNo ?? null,
    customer: p.customer ?? null,
    branch: p.branch ?? null,
    dealer_name: p.dealerName ?? null,
    distributor: p.distributor ?? null,
    dealer_code: p.dealerCode ?? null,
    dealer_claim_no: p.dealerClaimNo ?? null,
    dealer_wo_so: p.dealerWoSo ?? null,
    app_code: p.appCode ?? null,
    sdlg_no: p.sdlgNo && !/SDLG-PFR/i.test(p.sdlgNo) ? p.sdlgNo : null,
    sales_date: p.salesDate ?? null,
    failure_date: p.failureDate ?? null,
    dealer_repair_date: p.dealerRepairDate ?? null,
    completion_date: p.completionDate ?? null,
    dealer_claim_date: p.dealerClaimDate ?? null,
    hm_failure: p.hmFailure ?? null,
    hm_completion: p.hmCompletion ?? null,
    fault_description: p.faultDescription ?? null,
    cause_analyze: p.causeAnalyze ?? null,
    comment: p.comment ?? null,
    causing_part_no: p.causingPartNo ?? null,
    causing_part_desc: p.causingPartDesc ?? null,
    failure_part_location: p.failurePartLocation ?? null,
    repair_method: p.repairMethod ?? null,
    technical_personnel: p.technicalPersonnel ?? null,
    mileage_to_site: p.mileageToSite ?? mileageKm,
    labour_hrs: labourHrs,
    labour_rate: labourRate,
    labour_amount: labourAmount,
    mileage_km: mileageKm,
    mileage_rate: mileageRate,
    mileage_amount: mileageAmount,
    other_amount: otherAmount,
    parts_total: partsTotal,
    total_amount: total,
    currency: p.currency ?? null,
    claim_type: p.claimType ?? null,
    repair_status: p.repairStatus ?? null,
    parts,
    photo_labels: p.photoLabels ?? null,
    photo_count: Array.isArray(p.photoLabels) ? p.photoLabels.length : null,
    source_raw_text: rawText.slice(0, 50000),
    source_fields: p as Record<string, unknown>,
    source_provenance: { via: 'web-sdlg-parse', at: new Date().toISOString() },
  }
}

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
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
}

/** Selalu kembalikan YYYY-MM-DD atau null (aman untuk input type=date). */
export function dateIso(v: unknown): string | null {
  const s = clean(v)
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    let y = m[3]
    if (y.length === 2) y = '20' + y
    const dd = m[1].padStart(2, '0')
    const mm = m[2].padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  m = s.match(/^(\d{1,2})[\-\s\/]+([A-Za-z]{3,9})[\-\s\/]+(\d{2,4})$/)
  if (m) {
    const mm = MONTHS[m[2].toLowerCase()]
    if (!mm) return null
    let y = m[3]
    if (y.length === 2) y = '20' + y
    return `${y}-${String(mm).padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }

  m = s.match(/^([A-Za-z]{3,9})[\-\s\/]+(\d{1,2})[\-\s\/]+(\d{2,4})$/)
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()]
    if (!mm) return null
    let y = m[3]
    if (y.length === 2) y = '20' + y
    return `${y}-${String(mm).padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }

  return null
}

/** Samakan pemisah: tab & spasi ganda → tab. */
function normalizeRaw(rawText: string): string {
  return rawText
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t+/g, '\t')
    .replace(/ {2,}/g, '\t')
}

function normKey(s: string) {
  return clean(s)
    .toLowerCase()
    .replace(/[.:"']/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Bangun pasangan label → nilai dari sel-sel berurutan.
 * Cocok untuk paste Excel (tab) maupun spasi ganda.
 */
function buildPairs(rawText: string): { key: string; value: string }[] {
  const raw = normalizeRaw(rawText)
  const pairs: { key: string; value: string }[] = []
  const lines = raw.split('\n')

  for (const line of lines) {
    const cells = line.split('\t').map(clean).filter((c, i, arr) => c || arr.length > 1)
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      if (!cell) continue
      // "Label: value" dalam satu sel
      const inline = cell.match(/^(.{3,60}?)\s*:\s*(.+)$/)
      if (inline && !/https?:/i.test(cell)) {
        pairs.push({ key: normKey(inline[1]), value: clean(inline[2]) })
      }
      // Label di sel ini, nilai di sel berikutnya
      const next = cells[i + 1]
      if (next && next.length > 0 && cell.length >= 3 && cell.length <= 80) {
        pairs.push({ key: normKey(cell), value: next })
      }
    }
  }
  return pairs
}

function findPair(pairs: { key: string; value: string }[], labels: string[]): string | null {
  const wants = labels.map(normKey)
  for (const { key, value } of pairs) {
    for (const w of wants) {
      if (key === w || key.startsWith(w + ' ') || key.endsWith(' ' + w) || key.includes(w)) {
        // Hindari match terlalu longgar untuk key pendek
        if (w.length < 6 && key !== w && !key.startsWith(w)) continue
        const v = clean(value)
        if (!v) continue
        if (/^(signature|date)$/i.test(v)) continue
        return v
      }
    }
  }
  return null
}

function findRegex(raw: string, re: RegExp): string | null {
  const m = raw.match(re)
  return m ? clean(m[1]) : null
}

export function parsePfrLocal(rawText: string): ParsedPfr {
  const raw = normalizeRaw(rawText)
  const pairs = buildPairs(rawText)
  const p: ParsedPfr = {}

  const g = (...labels: string[]) => findPair(pairs, labels)

  p.distributorNo = g('Distributor No') || findRegex(raw, /Distributor No[:\s\t]+(\S+)/i)
  p.sdlgNo = g('SDLG No')
  p.dealerWoSo = g('Dealer WO/SO', 'Dealer WO') || findRegex(raw, /Dealer WO\/?SO[\s\t]+(\S+)/i)
  p.appCode = g('App Code', 'App. Code')
  p.model = g('Product Name (Model)', 'Product Name') ||
    findRegex(raw, /Product Name \(Model\)[\s\t]+([^\t\n]+)/i)
  p.hmFailure = num(
    g('Working Hours (Hour Meter Reading)', 'Working Hours', 'Hour Meter Reading') ||
      findRegex(raw, /Working Hours \(Hour Meter Reading\)[\s\t]+([0-9.,]+)/i),
  )
  p.distributor = g('Distributor')
  // Distributor kadang ketuker dengan "PT. ..." setelah label Distributor di baris model
  if (p.distributor && /SDLG|Working|Hour/i.test(p.distributor)) {
    p.distributor =
      findRegex(raw, /Distributor[\s\t]+(PT\.?[^\t\n]+)/i) || p.distributor
  }
  p.indentNo =
    g('Indent No (Machine Build No)', 'Indent No. (Machine Build No.)', 'Indent No') ||
    findRegex(raw, /Indent No[^	\n]{0,40}?[\s\t]+([A-Z0-9]+)/i)
  p.salesDate = dateIso(g('Sales Date (DD/MM/YY)', 'Sales Date'))
  p.customer = g('Customer Name') || findRegex(raw, /Customer Name[\s\t]+([^\t\n]+)/i)
  p.serialNo = g('Serial No', 'Serial No.') || findRegex(raw, /Serial No\.?[\s\t]+([A-Z0-9]+)/i)
  p.failureDate = dateIso(g('Failure Date'))
  p.dealerName =
    g('Contact Info (Dealer Name)', 'Dealer Name') ||
    findRegex(raw, /Contact Info \(Dealer Name\)[\s\t]+([^\t\n]+)/i)
  p.dealerCode = g('Dealer Code')
  p.dealerClaimNo = g('Dealer Claim No', 'Dealer Claim No.')
  p.dealerRepairDate = dateIso(g('Dealer Repair Date', 'Dealer  Repair Date'))
  p.dealerClaimDate = dateIso(g('Dealer Claim Date', 'Dealer  Claim Date'))
  p.faultDescription =
    g('Fault Description') || findRegex(raw, /Fault Description[\s\t]+([^\t\n]+)/i)

  // Blok teks panjang
  const cause = raw.match(
    /Cause Analyze[^
]{0,40}?[\s\t"']+([\s\S]{10,800}?)(?=Comment|Causing Part|Handling Result)/i,
  )
  if (cause) p.causeAnalyze = clean(cause[1].replace(/"/g, ' '))
  const comment = raw.match(
    /Comment[\s\t"']+([\s\S]{5,600}?)(?=Causing Part|Handling Result)/i,
  )
  if (comment) p.comment = clean(comment[1].replace(/"/g, ' '))
  const method = raw.match(
    /Handling Result[^
]{0,40}?[\s\t"']+([\s\S]{5,400}?)(?=Customer|Signature|Part Replacement)/i,
  )
  if (method) p.repairMethod = clean(method[1].replace(/"/g, ' '))

  const cp =
    g('Causing Part Number (Description)', 'Causing Part Number') ||
    findRegex(raw, /Causing Part Number[^
]{0,20}?[\s\t]+([^\t\n]+)/i)
  if (cp) {
    const m = cp.match(/^(\S+)\s*\((.+)\)\s*$/)
    if (m) {
      p.causingPartNo = m[1]
      p.causingPartDesc = m[2]
    } else {
      p.causingPartNo = clean(cp.split(/\s{2,}/)[0])
      const dm = cp.match(/\(([^)]+)\)/)
      if (dm) p.causingPartDesc = clean(dm[1])
    }
  }

  p.technicalPersonnel =
    g('Signature of Technical Personnel', 'Technical Personnel') ||
    findRegex(raw, /Signature of Technical Personnel:?[\s\t]+([^\t\n]+)/i)
  p.completionDate = dateIso(
    g('Repairs Completion Date', 'Repairs Completion Date:') ||
      findRegex(raw, /Repairs Completion Date:?[\s\t]+([^\t\n]+)/i),
  )

  const fin = raw.match(/Finish Hour Meter\s*\(([^)]+)\)/i)
  if (fin) p.hmCompletion = num(fin[1])
  const eng = raw.match(
    /(?:Engine Name Plate|Serial Number Engine)\s*\((?:SN\.?\s*)?([^)]+)\)/i,
  )
  if (eng) p.engineSerialNo = clean(eng[1])
  const floc = raw.match(/Failure Part Location\s*\(([^)]+)\)/i)
  if (floc) p.failurePartLocation = clean(floc[1])
  const mts = raw.match(/Mil+(?:e|a)ge\s+to\s+(?:Site|Location)\s*=\s*([0-9.,]+)/i)
  if (mts) {
    p.mileageToSite = num(mts[1])
    p.mileageKm = p.mileageToSite
  }

  const lab = raw.match(/Labour[\s\S]{0,100}?Hrs[\s\t]*([0-9]+(?:[.,][0-9]+)?)/i)
  if (lab) p.labourHrs = num(lab[1])
  const mil = raw.match(/Mileage[\s\S]{0,100}?Km[\s\t]*([0-9]+(?:[.,][0-9]+)?)/i)
  if (mil) p.mileageKm = num(mil[1])

  if (/\bUSD\b/i.test(raw)) p.currency = 'USD'
  else if (/\bIDR\b|\bRP\b/i.test(raw)) p.currency = 'IDR'

  p.parts = parsePartsLocal(raw)
  if (p.completionDate) p.repairStatus = 'Repair Completed'

  return p
}

function parsePartsLocal(raw: string): Record<string, unknown>[] {
  const lines = normalizeRaw(raw).split('\n')
  const out: Record<string, unknown>[] = []
  let inParts = false

  for (const line of lines) {
    if (/Part Replacement Record/i.test(line)) {
      inParts = true
      continue
    }
    if (/PARTS TOTAL|\*Copy last row/i.test(line)) break
    if (!inParts && !/SLG[-]?\d/i.test(line)) continue

    // Sel: failure, replacement, desc, qty, price, amount
    const cells = line.split('\t').map(clean).filter(Boolean)
    const codes = cells.filter((c) => /^SLG[-]?\d+/i.test(c))
    if (codes.length === 0) continue

    let description: string | null = null
    let qty: number | null = null
    let unitPrice: number | null = null
    let amount: number | null = null

    for (const c of cells) {
      if (/^SLG[-]?\d+/i.test(c)) continue
      if (/^(Failure|Replacement|Description|Quantity|Unit|Amount)/i.test(c)) continue
      if (/^[A-Za-z][A-Za-z\s\-]{2,40}$/.test(c) && !description) {
        description = c
        continue
      }
      const n = num(c)
      if (n == null) continue
      if (qty == null && n <= 100 && Number.isInteger(n)) {
        qty = n
        continue
      }
      if (unitPrice == null) {
        unitPrice = n
        continue
      }
      if (amount == null) amount = n
    }

    const failure = codes[0].replace(/\s+/g, '')
    const replacement = (codes[1] || codes[0]).replace(/\s+/g, '')
    if (qty == null) qty = 1
    if (amount == null && unitPrice != null && qty != null) amount = qty * unitPrice

    out.push({
      failurePartNo: failure,
      replacementPartNo: replacement,
      description,
      qty,
      unitPrice,
      amount,
    })
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
    }
  }
  const ap = Array.isArray(a.parts) ? (a.parts as unknown[]) : []
  const bp = Array.isArray(b.parts) ? (b.parts as unknown[]) : []
  if (bp.length > ap.length) out.parts = bp
  else if (ap.length >= bp.length && ap.length) out.parts = ap
  return out
}

export function normalizeParts(parts: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(parts) || parts.length === 0) return null
  return parts.map((p: Record<string, unknown>) => {
    const failure = p.failurePartNo ?? p.failure_part_no ?? null
    const replacement = p.replacementPartNo ?? p.replacement_part_no ?? p.part_no ?? failure
    let description = p.description != null ? String(p.description).trim() : null
    if (description && /^SLG[-]?\d+/i.test(description)) description = null
    const qty = num(p.qty ?? p.quantity)
    const unitPrice = num(p.unitPrice ?? p.unit_price ?? p.price)
    let amount = num(p.amount ?? p.total)
    if (amount == null && qty != null && unitPrice != null) amount = qty * unitPrice
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

  // Lokal diutamakan untuk field kosong dari server; tanggal dinormalisasi
  const merged = mergeParsed(remote, local)
  for (const dk of [
    'salesDate',
    'failureDate',
    'dealerRepairDate',
    'completionDate',
    'dealerClaimDate',
  ] as const) {
    const d = dateIso(merged[dk])
    if (d) merged[dk] = d
    else if (merged[dk] && !/^\d{4}-\d{2}-\d{2}$/.test(String(merged[dk]))) {
      merged[dk] = null
    }
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
    sales_date: dateIso(p.salesDate) ?? p.salesDate ?? null,
    failure_date: dateIso(p.failureDate) ?? p.failureDate ?? null,
    dealer_repair_date: dateIso(p.dealerRepairDate) ?? p.dealerRepairDate ?? null,
    completion_date: dateIso(p.completionDate) ?? p.completionDate ?? null,
    dealer_claim_date: dateIso(p.dealerClaimDate) ?? p.dealerClaimDate ?? null,
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
    total_amount: total ?? partsTotal,
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

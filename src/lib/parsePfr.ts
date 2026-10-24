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

/** Lengkapi field yang sering ada di teks PFR tapi kadang tidak di JSON parse */
export function enrichFromRaw(p: ParsedPfr, raw: string): ParsedPfr {
  const out = { ...p }
  if (out.hmCompletion == null) {
    const m = raw.match(/Finish Hour Meter\s*\(([^)]+)\)/i)
    if (m) out.hmCompletion = num(m[1])
  }
  if (!out.engineSerialNo) {
    const m = raw.match(/Engine Name Plate\s*\((?:SN\.?\s*)?([^)]+)\)/i)
    if (m) out.engineSerialNo = m[1].trim()
  }
  if (!out.failurePartLocation) {
    const m = raw.match(/Failure Part Location\s*\(([^)]+)\)/i)
    if (m) out.failurePartLocation = m[1].trim()
  }
  if (out.mileageToSite == null) {
    const m = raw.match(/Mil(?:e|l)age To Site\s*=\s*([0-9.,]+)/i)
    if (m) out.mileageToSite = num(m[1])
  }
  if (out.mileageKm == null && out.mileageToSite != null) {
    out.mileageKm = out.mileageToSite
  }
  // Labour Hrs / Mileage Km dari blok biaya (angka di baris Labour / Mileage)
  if (out.labourHrs == null) {
    const m = raw.match(/Labour[\s\S]{0,40}?\bHrs\b[\s\S]{0,20}?([0-9]+(?:[.,][0-9]+)?)/i)
    if (m) out.labourHrs = num(m[1])
  }
  if (out.mileageKm == null) {
    const m = raw.match(/Mileage[\s\S]{0,40}?\bKm\b[\s\S]{0,20}?([0-9]+(?:[.,][0-9]+)?)/i)
    if (m) out.mileageKm = num(m[1])
  }
  if (!out.currency) {
    if (/\bUSD\b|\$/i.test(raw)) out.currency = 'USD'
    else if (/\bIDR\b|\bRP\b/i.test(raw)) out.currency = 'IDR'
  }
  return out
}

export function normalizeParts(parts: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(parts) || parts.length === 0) return null
  return parts.map((p: Record<string, unknown>) => {
    const failure = p.failurePartNo ?? p.failure_part_no ?? p.part_no ?? null
    const replacement = p.replacementPartNo ?? p.replacement_part_no ?? failure
    const qty = num(p.qty ?? p.quantity)
    const unitPrice = num(p.unitPrice ?? p.unit_price ?? p.price)
    const amount = num(p.amount ?? p.total) ?? (qty != null && unitPrice != null ? qty * unitPrice : null)
    return {
      part_no: replacement != null ? String(replacement).trim() : null,
      failure_part_no: failure != null ? String(failure).trim() : null,
      description: p.description != null ? String(p.description).trim() : null,
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
  const { data, error } = await supabase.functions.invoke('gemini-parse-claim', {
    body: { rawText },
  })
  if (error) throw new Error(error.message || 'Gagal memanggil parser')
  if (data?.error) throw new Error(String(data.error))
  const enriched = enrichFromRaw((data?.data ?? {}) as ParsedPfr, rawText)
  return {
    data: enriched,
    model: String(data?.model ?? 'unknown'),
    warning: data?.warning ? String(data.warning) : undefined,
  }
}

/** Map hasil parse → kolom tabel claims (selengkap mungkin) */
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

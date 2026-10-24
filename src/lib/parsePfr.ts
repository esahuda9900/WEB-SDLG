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
}

export type ParseResult = {
  data: ParsedPfr
  model: string
  warning?: string
}

export async function invokeParsePfr(rawText: string): Promise<ParseResult> {
  const { data, error } = await supabase.functions.invoke('gemini-parse-claim', {
    body: { rawText },
  })
  if (error) throw new Error(error.message || 'Gagal memanggil parser')
  if (data?.error) throw new Error(String(data.error))
  return {
    data: (data?.data ?? {}) as ParsedPfr,
    model: String(data?.model ?? 'unknown'),
    warning: data?.warning ? String(data.warning) : undefined,
  }
}

/** Map hasil parse → kolom tabel claims */
export function parsedToClaimRow(p: ParsedPfr, rawText: string) {
  const claimId =
    (p.distributorNo && /SDLG-PFR/i.test(p.distributorNo) ? p.distributorNo.trim() : null) ||
    (p.sdlgNo && /SDLG-PFR/i.test(p.sdlgNo) ? p.sdlgNo.trim() : null)

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
    mileage_to_site: p.mileageToSite ?? null,
    labour_hrs: p.labourHrs ?? null,
    labour_rate: p.labourRate ?? null,
    mileage_km: p.mileageKm ?? null,
    mileage_rate: p.mileageRate ?? null,
    other_amount: p.otherAmount ?? null,
    currency: p.currency ?? null,
    claim_type: p.claimType ?? null,
    repair_status: p.repairStatus ?? null,
    parts: p.parts ?? null,
    source_raw_text: rawText.slice(0, 50000),
    source_fields: p as Record<string, unknown>,
    source_provenance: { via: 'web-sdlg-parse', at: new Date().toISOString() },
  }
}

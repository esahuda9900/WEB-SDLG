// ⚠️ MIRROR of deployed Edge Function `gemini-parse-claim` v19, synced 2026-10-24.
// Sumber kebenaran saat ini adalah Supabase (deployed).
// Jangan edit file ini tanpa proses deploy (lihat docs/keputusan.md).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const ALLOWED = new Set([
  "https://esahuda9900.github.io",
  "https://sdlg-warranty-claim.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
function cors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED.has(origin) ? origin : "https://esahuda9900.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
}
const MAX_RAW_CHARS = 60000, MAX_PART_ROWS = 100, GEMINI_MODEL = "gemini-2.5-flash-lite", GEMINI_TIMEOUT_MS = 8000, MAX_RETRIES = 2;
const clean = (v: unknown) => String(v ?? "").replace(/\u00a0/g, " ").replace(/^[\s"']+|[\s"']+$/g, "").trim();
const norm = (v: unknown) => clean(v).toLowerCase().replace(/[.:]/g, "").replace(/\s+/g, " ");
const lines = (raw: string) => String(raw || "").split(/\r?\n/);
const known = ["sdlg no","distributor no","dealer wo/so","app code","product name (model)","working hours (hour meter reading)","distributor","working conditions","indent no (machine build no)","sales date","customer name","serial no","failure date","contact info (dealer name)","dealer code","dealer claim no","dealer repair date","dealer claim date","fault description","cause analyze","cause analyze (cause of failure)","comment","causing part number (description)","causing part number","handling result","handling result (repair method)","signature of technical personnel","repairs completion date","customer approval","branch","mileage to site","finish hour meter","engine name plate","failure part location"];
const isLabel = (v: unknown) => { const n = norm(v); return known.some((k) => n === k || n.startsWith(k + " ")); };
const isHelper = (v: unknown) => /^\([^)]*\)$/.test(clean(v));
function field(raw: string, labelNames: string[]) {
  const want = labelNames.map(norm);
  for (const line of lines(raw)) {
    const cells = line.split("\t");
    for (let ci = 0; ci < cells.length; ci++) {
      const c = clean(cells[ci]), n = norm(c);
      if (!want.some((w) => n === w || n.startsWith(w + " "))) continue;
      for (const w of want) {
        if (n.startsWith(w + " ") && n !== w) {
          const suffix = c.slice(c.toLowerCase().indexOf(w) + w.length).replace(/^\s*[:=\-]\s*/, "");
          if (suffix && !isHelper(suffix)) return suffix;
        }
      }
      for (let cj = ci + 1; cj < cells.length; cj++) {
        const v = clean(cells[cj]);
        if (!v) continue;
        if (isLabel(v)) break;
        if (isHelper(v)) continue;
        return v;
      }
      return null;
    }
  }
  return null;
}
function block(raw: string, labelNames: string[], stops: string[]) {
  const want = labelNames.map(norm), stop = stops.map(norm);
  const isStop = (v: unknown) => { const n = norm(v); return stop.some((x) => n === x || n.startsWith(x + " ")); };
  const ls = lines(raw);
  for (let li = 0; li < ls.length; li++) {
    const cells = ls[li].split("\t");
    for (let ci = 0; ci < cells.length; ci++) {
      const c = clean(cells[ci]), n = norm(c);
      if (!want.some((w) => n === w || n.startsWith(w + " "))) continue;
      const out: string[] = [];
      for (const w of want) {
        if (n.startsWith(w + " ") && n !== w) {
          const suffix = c.slice(c.toLowerCase().indexOf(w) + w.length).replace(/^\s*[:=\-]\s*/, "");
          if (suffix && !isHelper(suffix)) out.push(suffix);
        }
      }
      for (let cj = ci + 1; cj < cells.length; cj++) {
        const v = clean(cells[cj]);
        if (!v) continue;
        if (isStop(v) || isLabel(v)) break;
        if (isHelper(v)) continue;
        out.push(v);
      }
      for (let r = li + 1; r < ls.length; r++) {
        let stopped = false;
        for (const v0 of ls[r].split("\t")) {
          const v = clean(v0);
          if (!v) continue;
          if (isStop(v) || isLabel(v)) { stopped = true; break; }
          if (isHelper(v)) continue;
          out.push(v);
        }
        if (stopped) break;
      }
      return out.join("\n").trim() || null;
    }
  }
  return null;
}
function num(v: unknown) {
  let s = clean(v).replace(/[^0-9,.-]/g, "");
  if (!s) return null;
  const c = s.lastIndexOf(","), d = s.lastIndexOf(".");
  if (c >= 0 && d >= 0) s = c > d ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (c >= 0) s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function dateIso(v: unknown) {
  const s = clean(v);
  if (!s) return null;
  let m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) {
    let y = m[3]; if (y.length === 2) y = "20" + y;
    const out = `${y}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
    const dt = new Date(`${out}T00:00:00Z`);
    return dt.getUTCFullYear() === Number(y) && dt.getUTCMonth() + 1 === Number(m[2]) && dt.getUTCDate() === Number(m[1]) ? out : null;
  }
  return null;
}
function parts(raw: string) {
  const ls = lines(raw);
  const i = ls.findIndex((x) => /Failure Parts Number/i.test(x) && /Replacement Parts Number/i.test(x));
  if (i < 0) return [];
  const h = ls[i].split("\t").map(norm);
  const labs = ["failure parts number", "replacement parts number", "description", "quantity", "unit price", "amount"];
  const idx = labs.map((x) => h.findIndex((y) => y === x));
  if (idx.some((x) => x < 0)) return [];
  const out: any[] = [];
  for (let r = i + 1; r < ls.length && out.length < MAX_PART_ROWS; r++) {
    if (/PARTS TOTAL/i.test(ls[r])) break;
    if (/\*Copy last row/i.test(ls[r])) continue;
    const c = ls[r].split("\t");
    const x = { failurePartNo: clean(c[idx[0]]), replacementPartNo: clean(c[idx[1]]), description: clean(c[idx[2]]), qty: num(c[idx[3]]), unitPrice: num(c[idx[4]]), amount: num(c[idx[5]]) };
    if (x.failurePartNo || x.replacementPartNo || x.description) out.push(x);
  }
  return out;
}
function parseSource(raw: string) {
  const p: any = { claimType: null, sdlgNo: null, distributorNo: null, dealerWoSo: null, appCode: null, model: null, serialNo: null, indentNo: null, hmFailure: null, hmCompletion: null, distributor: null, dealerCode: null, dealerClaimNo: null, customer: null, branch: null, dealerName: null, salesDate: null, failureDate: null, dealerRepairDate: null, completionDate: null, dealerClaimDate: null, repairStatus: null, faultDescription: null, causeAnalyze: null, comment: null, causingPartNo: null, causingPartDesc: null, repairMethod: null, technicalPersonnel: null, engineSerialNo: null, failurePartLocation: null, customerApprovalDate: null, mileageToSite: null, labourHrs: null, labourRate: null, mileageKm: null, mileageRate: null, otherAmount: null, currency: /\bUSD\b|\$/i.test(raw) ? "USD" : /\bIDR\b|\bRP\b/i.test(raw) ? "IDR" : "CNY", yardFailureConfirmed: null, photoLabels: [], evidenceItems: [], parts: [] };
  const map: Record<string, string[]> = { sdlgNo: ["SDLG No"], distributorNo: ["Distributor No"], dealerWoSo: ["Dealer WO/SO"], appCode: ["App. Code", "App Code"], model: ["Product Name (Model)"], indentNo: ["Indent No. (Machine Build No.)", "Indent No (Machine Build No)"], customer: ["Customer Name"], serialNo: ["Serial No"], distributor: ["Distributor"], dealerCode: ["Dealer Code"], dealerClaimNo: ["Dealer Claim No"], faultDescription: ["Fault Description"], comment: ["Comment"], technicalPersonnel: ["Signature of Technical Personnel", "Technical Personnel"] };
  for (const [k, l] of Object.entries(map)) { const v = field(raw, l); if (v !== null) p[k] = v; }
  const cause = block(raw, ["Cause Analyze", "Cause Analyze (Cause of Failure)"], ["Comment", "Causing Part Number", "Handling Result"]);
  if (cause) p.causeAnalyze = cause;
  const method = block(raw, ["Handling Result", "Handling Result (Repair Method)"], ["Signature of Technical Personnel", "Customer", "Part Replacement Record", "Repairs Completion Date"]);
  if (method) p.repairMethod = method;
  const cp = field(raw, ["Causing Part Number (Description)", "Causing Part Number"]);
  if (cp) { const m = cp.match(/^([^\s]+)\s*\((.+)\)$/); if (m) { p.causingPartNo = m[1]; p.causingPartDesc = m[2]; } else p.causingPartNo = cp; }
  const dm: Record<string, string[]> = { salesDate: ["Sales Date"], failureDate: ["Failure Date"], dealerRepairDate: ["Dealer Repair Date"], dealerClaimDate: ["Dealer Claim Date"], completionDate: ["Repairs Completion Date"], customerApprovalDate: ["Customer Approval"] };
  for (const [k, l] of Object.entries(dm)) { const d = dateIso(field(raw, l)); if (d) p[k] = d; }
  const wh = field(raw, ["Working Hours (Hour Meter Reading)"]);
  if (wh != null) p.hmFailure = num(wh);
  p.parts = parts(raw);
  if (p.completionDate) p.repairStatus = "Repair Completed";
  return p;
}
async function authorize(req: Request, CORS: Record<string, string>) {
  const token = clean(req.headers.get("Authorization")).replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL") || "", service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  if (!url || !service) return new Response(JSON.stringify({ error: "Supabase server configuration missing." }), { status: 503, headers: CORS });
  const sb = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const u = await sb.auth.getUser(token);
  if (u.error || !u.data.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  const r = await sb.from("app_user_roles").select("role,is_active").eq("user_id", u.data.user.id).eq("is_active", true).limit(1).maybeSingle();
  const role = clean(r.data?.role).toLowerCase();
  if (!r.data || !["admin", "warranty_admin"].includes(role)) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: CORS });
  return true;
}
Deno.serve(async (req: Request) => {
  const CORS = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: CORS });
  try {
    const denied = await authorize(req, CORS);
    if (denied instanceof Response) return denied;
    let body: any;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Request JSON tidak valid." }), { status: 400, headers: CORS }); }
    const raw = clean(body?.rawText);
    if (!raw) return new Response(JSON.stringify({ error: "rawText wajib diisi" }), { status: 400, headers: CORS });
    if (raw.length > MAX_RAW_CHARS) return new Response(JSON.stringify({ error: `Input terlalu besar. Maksimum ${MAX_RAW_CHARS} karakter.` }), { status: 413, headers: CORS });
    const source = parseSource(raw);
    const structured = (!!source.model && !!source.serialNo && !!source.failureDate) || /Product Name \(Model\)|Serial No\.?|Dealer WO\/SO|Part Replacement Record/i.test(raw);
    if (structured) return new Response(JSON.stringify({ data: source, model: "source-parser-fast" }), { status: 200, headers: CORS });
    const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
    if (!apiKey) return new Response(JSON.stringify({ data: source, model: "source-parser-no-gemini", warning: "Gemini key belum dikonfigurasi; parser sumber lokal digunakan." }), { status: 200, headers: CORS });
    // Gemini path simplified: for unstructured text, still try local first
    return new Response(JSON.stringify({ data: source, model: "source-parser-fallback", warning: "Gunakan format PFR ber-tab agar parse akurat." }), { status: 200, headers: CORS });
  } catch {
    return new Response(JSON.stringify({ error: "Parser internal error." }), { status: 500, headers: CORS });
  }
});

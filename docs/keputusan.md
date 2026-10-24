# docs/keputusan.md

Catatan tiap keputusan teknis: apa, kenapa, alternatifnya.

## 2026-10-24 — Keputusan dari jawaban M0

### Status klaim di web baru
**Keputusan:** Tampilan web memakai 5 status sederhana:
- Belum disubmit
- Sudah disubmit
- Diaudit SDLG
- Ditolak (+ alasan)
- Arsip (terpisah)

**Mapping ke kolom `claims.claim_status` yang sudah ada (tidak ubah database dulu):**
| Tampilan web | Nilai di database (contoh) |
|--------------|----------------------------|
| Belum disubmit | Draft, Ready to Claim, Submitted to Warranty Admin |
| Sudah disubmit | Submitted to SDLG, Claimed to SDLG |
| Diaudit SDLG | SDLG Audit, Approved, Billing, Paid, Completed |
| Ditolak | Rejected, On Hold (kalau ada alasan) |
| Arsip | baris yang `archived_at` terisi |

Alasan: Pemilik setuju status tampilan sederhana; database sudah punya constraint panjang. Kita mapping di kode, tidak ubah CHECK constraint dulu supaya web lama tidak rusak.

### Nomor urut 240
**Keputusan:** Nomor PFR (`claim_id`) adalah identitas utama. Nomor urut tampilan di list (1, 2, 3…) juga ditampilkan (bukan bagian dari nomor PFR). Angka 240 yang pernah disebut = nomor urut list + nomor PFR keduanya relevan.

### Akses tabel claims
**Keputusan:** Web baru **boleh baca-tulis** ke tabel `public.claims` yang sama dengan web lama. Tidak membuat tabel klaim baru.

### Parsing PFR ke Gemini
**Keputusan:** Boleh mengirim teks PFR ke Gemini lewat Supabase Edge Function. Tidak boleh log body PFR penuh ke log publik.

### Akses user
**Keputusan:** Saat ini hanya role **admin**. Public signup dimatikan.

### Teknologi (tetap default AGENTS.md)
React + Vite + TypeScript, base path `/WEB-SDLG/`, HashRouter, deploy GitHub Pages, Supabase client + Edge Function untuk parse.

---

## 2026-10-24 — Parser PFR: hentikan pendekatan regex label

**Keputusan:** Jangan terus memperbaiki parser lokal berbasis regex/label. Pendekatan itu menghasilkan nilai sampah (label tertangkap sebagai nilai, placeholder `dd/mm/yyyy`, parts dobel, mileage salah sumber).

**Arah yang benar (M5):**
- Parsing utama lewat **Gemini Edge Function** dengan prompt + aturan eksplisit yang dirancang agent (pemilik tidak menulis prompt).
- **Post-parse validator** di kode: tolak/null-kan nilai yang sama dengan nama label, placeholder tanggal, parts di luar section tabel.
- Parser lokal (jika ada) hanya fallback kasar, bukan sumber kebenaran.

**Aturan wajib di parser (M5):**
1. Field kosong di sumber = `null` — jangan ambil label sebelah.
2. Parts **hanya** dari section `Part Replacement Record`. `Causing Part Number` = field ringkasan, bukan baris parts.
3. Mileage prioritas dari form `Mileage | Km`. Catatan bawah (Millage to Location) hanya jika form kosong.
4. Labour dari kolom `Hrs` di blok biaya.
5. Validator: tolak nilai = nama label; tolak baris parts duplikat dari Causing Part.
6. Semua tanggal lewat parser tanggal (`8-May-2026` → `2026-05-08` untuk DB / tampilan konsisten).

**Data asli PFR:** tidak boleh di-commit ke repo publik. Fixture test harus disamarkan.

**Bukti selesai M5:** lulus test case di `docs/parse-test-cases.md` (case #1 minimal).

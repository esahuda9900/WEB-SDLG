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

Alasan: Hindari duplikasi data. RLS akan diatur hati-hati supaya aman dan tidak memutus web lama.

### Parsing PFR ke Gemini
**Keputusan:** Boleh mengirim teks PFR ke Gemini lewat Supabase Edge Function. Tidak boleh log body PFR penuh ke log publik.

### Akses user
**Keputusan:** Saat ini hanya role **admin**. Public signup dimatikan.

### Teknologi (tetap default AGENTS.md)
React + Vite + TypeScript, base path `/WEB-SDLG/`, HashRouter, deploy GitHub Pages, Supabase client + Edge Function untuk parse.

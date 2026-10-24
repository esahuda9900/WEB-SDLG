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


---

## 2026-10-24 — Mirror source Edge Function deployed v19

**Path resmi untuk fungsi parse PFR:** `supabase/functions/gemini-parse-claim/`, mengikuti nama fungsi yang benar-benar aktif di Supabase. Dokumentasi lama menyebut `supabase/functions/parse-pfr`; itu tidak cocok dengan nama deployed. Source v19 disalin apa adanya ke repo agar dapat ditinjau dan diuji sebelum perubahan berikutnya. File mirror diberi header penanda dan **bukan berarti source repo otomatis ter-deploy**.

**Sumber kebenaran Edge Function:** **A — manual deploy via Supabase CLI** untuk M5. Perubahan pada mirror GitHub tidak mengubah fungsi produksi sampai ada deploy manual yang disengaja. Jika kelak memilih deploy otomatis, buat workflow `.github/workflows/deploy-functions.yml` dan gunakan GitHub Secret `SUPABASE_ACCESS_TOKEN`; itu di luar scope sekarang. Workflow yang ada hanya deploy GitHub Pages pada push ke `main`, bukan Edge Function.

**Temuan source v19 (2026-10-24):** source yang aktif tidak memanggil Gemini API. Input terstruktur mengembalikan `model: "source-parser-fast"`; jalur lain juga mengembalikan parser lokal beserta warning. Konstanta Gemini dan pembacaan nama environment variable tidak menghasilkan panggilan API. Ini berbeda dari dokumentasi M5 sebelumnya yang menyebut Gemini sebagai parser utama.

**Keputusan arsitektur M5 — status pending validasi:** arah yang diusulkan adalah deterministic-primary + Gemini fallback, tetapi keputusan final menunggu tes minimal 5 kasus PFR tersamarkan dan evaluasi hasil per field. Jangan menghapus jalur `source-parser-fast` dalam mirror/produksi pada commit ini.

**Tech debt / tes:** tidak ditemukan file test otomatis untuk Edge Function di repository saat mirror dibuat. Source v19 yang berjalan di production belum dilindungi oleh test khusus; commit berikutnya perlu menambahkan tes regresi bertahap sebelum memperbaiki parser. Jangan menggunakan PFR asli dalam fixture repo publik.

**Batas commit mirror:** hanya menambahkan snapshot source v19 dan dokumentasi. Tidak melakukan refactor, perubahan database, perubahan secret, atau deploy ke Supabase.

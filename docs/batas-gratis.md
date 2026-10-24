# docs/batas-gratis.md

Dicek 24 Oktober 2026 dari dokumentasi resmi / sumber terpercaya.

## Supabase (Free)
- Database size: **500 MB per project**
- Egress: **5 GB**/bulan
- Storage file: **1 GB**
- MAU Auth: **50.000**
- Edge Function invocations: **500.000**/bulan
- Project aktif: maksimal **2**; project pause setelah **1 minggu** tidak aktif
- Backup otomatis: **tidak ada** di Free (harus bikin sendiri)

Sumber: supabase.com docs + freetierfinder (cek 2026-10-23/24).

## GitHub (Free) + Pages + Actions
- Repo publik: unlimited
- GitHub Pages: gratis di repo **publik**, soft limit ~1 GB site, ~100 GB bandwidth/bulan
- Actions di repo **publik**: **gratis** (standard runner)
- Actions di repo private: 2.000 menit/bulan

Sumber: docs.github.com (cek 2026-10-24).

## Gemini API (Free tier)
- Model Flash (3.8 / 3.6): kira-kira **5 request/menit**, **~20 request/hari** per project (angka bisa berubah, cek di AI Studio)
- Flash-Lite: lebih longgar (~500/hari)
- Tidak ada biaya token di free tier selama dalam kuota
- Parsing PFR kita harus hemat (batch/cache) supaya tidak kehabisan kuota harian

Sumber: ai.google.dev + laporan komunitas Okt 2026.

## Grok / xAI
- Paket gratis Grok punya limit token sesi; sesi agent bisa putus. Karena itu kita wajib checkpoint sering (commit + STATUS.md).

## Implikasi untuk project
1. Backup database **wajib manual** sebelum migration apa pun (Free tidak punya automatic backup).
2. Parsing PFR lewat Gemini: pakai model yang hemat kuota, + selalu sediakan input manual.
3. Deploy ke GitHub Pages dari repo publik = gratis total untuk CI & hosting.

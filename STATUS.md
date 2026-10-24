# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: **M1 — Fondasi + backup darurat** (deploy sukses, menunggu tes pemilik)
- Yang sedang dikerjakan: Site live, pemilik perlu buka URL dan konfirmasi.

## Catatan Estafet (update di setiap langkah, bukan hanya akhir sesi)
- Sedang mengerjakan: M1 hampir selesai
- Sudah sampai mana:
  - PR M1 di-merge
  - Workflow deploy Vite → GitHub Pages **sukses** (run #5)
  - Workflow static.yml yang salah (upload source) sudah dihapus
  - Site live: https://esahuda9900.github.io/WEB-SDLG/
  - HTML sudah berisi assets hasil build (bukan source mentah)
- File yang sedang diubah / branch: main
- Langkah berikutnya: Pemilik tes URL → kalau OK, tutup M1 → mulai M2 Login
- Keputusan yang belum final: (tidak ada)
- Bug yang sedang dilacak: (belum)

## Sudah selesai dan dites pemilik
- (kosong — menunggu konfirmasi URL)

## Sudah dibuat, belum dites pemilik
- Halaman beranda M1 di https://esahuda9900.github.io/WEB-SDLG/
- docs/backup-darurat.md

## Bug / masalah yang diketahui
- (kosong)

## Keputusan penting (detail di docs/keputusan.md)
- Status tampilan 5 kategori + mapping
- Baca-tulis claims yang sama
- Gemini lewat Edge Function diizinkan
- Hanya admin

## Hal baru yang dipelajari hari ini (dari penjelasan pemilik)
- Repo: WEB-SDLG, base /WEB-SDLG/
- Jawaban M0 sudah dicatat

## Langkah berikutnya
1. Pemilik buka https://esahuda9900.github.io/WEB-SDLG/ dan konfirmasi tampilan
2. Setelah OK → M1 selesai, lanjut M2 Login

## Commit stabil terakhir (untuk rollback)
- 0beb10b — hapus static.yml + deploy sukses
- 4eb4c6e — fix ci tanpa cache npm

# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: **M1 — Fondasi + backup darurat**
- Yang sedang dikerjakan: PR #1 sudah di-merge. Workflow deploy Pages sedang antre / berjalan.

## Catatan Estafet (update di setiap langkah, bukan hanya akhir sesi)
- Sedang mengerjakan: M1 — aktifkan Pages + tes URL
- Sudah sampai mana:
  - PR #1 (feature/m1-fondasi) di-merge ke main (squash)
  - Scaffolding React + Vite + TypeScript ada di main
  - base path `/WEB-SDLG/`, HashRouter, workflow deploy
  - docs/backup-darurat.md sudah ada
  - Workflow run #1 status: queued/in progress
- File yang sedang diubah / branch: main
- Langkah berikutnya: Pemilik aktifkan GitHub Pages (source = GitHub Actions) → tunggu workflow hijau → tes URL
- Keputusan yang belum final: (tidak ada)
- Bug yang sedang dilacak: (belum)

## Sudah selesai dan dites pemilik
- (kosong)

## Sudah dibuat, belum dites pemilik
- Scaffolding M1 di main
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
1. Aktifkan GitHub Pages: Settings → Pages → Source = **GitHub Actions**
2. Tunggu workflow hijau di tab Actions
3. Tes: https://esahuda9900.github.io/WEB-SDLG/
4. Setelah lolos → tutup M1, lanjut M2 Login

## Commit stabil terakhir (untuk rollback)
- 9795c35 — M1 merge (squash)

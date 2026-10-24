# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: **M1 — Fondasi + backup darurat**
- Yang sedang dikerjakan: Scaffolding selesai di branch `feature/m1-fondasi`. Siap PR & aktifkan GitHub Pages.

## Catatan Estafet (update di setiap langkah, bukan hanya akhir sesi)
- Sedang mengerjakan: M1 — fondasi web
- Sudah sampai mana:
  - Branch `feature/m1-fondasi` dibuat
  - Scaffolding React + Vite + TypeScript
  - base path `/WEB-SDLG/`, HashRouter
  - Halaman beranda sederhana (bahasa Indonesia)
  - Workflow GitHub Actions deploy ke Pages
  - Rencana backup darurat dicatat di `docs/backup-darurat.md`
  - Belum ada koneksi Supabase, belum ada login, belum migration
- File yang sedang diubah / branch: `feature/m1-fondasi`
- Langkah berikutnya: Buka PR → merge ke main → aktifkan GitHub Pages → pemilik tes URL
- Keputusan yang belum final: (tidak ada untuk M1)
- Bug yang sedang dilacak: (belum)

## Sudah selesai dan dites pemilik
- (kosong)

## Sudah dibuat, belum dites pemilik
- Scaffolding M1 di branch feature/m1-fondasi
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
1. Buat Pull Request feature/m1-fondasi → main
2. Merge (setelah pemilik OK)
3. Aktifkan GitHub Pages (Settings → Pages → source GitHub Actions)
4. Tes URL: https://esahuda9900.github.io/WEB-SDLG/

## Commit stabil terakhir (untuk rollback)
- d6f6e1a — fix(ci) npm install
- 3115ce2 — feat(m1) scaffolding
- 2b1237d — STATUS tutup M0

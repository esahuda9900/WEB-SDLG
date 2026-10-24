# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: M0 selesai → menunggu OK untuk mulai M1
- Yang sedang dikerjakan: Keputusan M0 sudah dicatat. Belum coding aplikasi.

## Catatan Estafet (update di setiap langkah, bukan hanya akhir sesi)
- Sedang mengerjakan: Menunggu OK pemilik untuk mulai M1 (Fondasi + backup darurat)
- Sudah sampai mana:
  - M0 selesai: struktur Supabase dipetakan, keputusan pemilik dicatat di docs/keputusan.md
  - Status tampilan web: Belum disubmit / Sudah disubmit / Diaudit SDLG / Ditolak / Arsip (mapping ke claim_status lama)
  - Boleh baca-tulis tabel claims yang sama
  - Boleh kirim teks PFR ke Gemini lewat Edge Function
  - Hanya admin, public signup mati
  - Nomor PFR = identitas; nomor urut list juga ditampilkan
- File yang sedang diubah / branch: main (docs saja). M1 akan pakai branch `feature/m1-fondasi`
- Langkah berikutnya: Setelah OK → buat branch M1, scaffolding Vite React TS, CI, Pages, desain backup darurat
- Keputusan yang belum final: (sudah final dari M0)
- Bug yang sedang dilacak: (belum)

## Sudah selesai dan dites pemilik
- (kosong — M0 adalah pemetaan, belum ada UI)

## Sudah dibuat, belum dites pemilik
- Bootstrap docs + keputusan M0

## Bug / masalah yang diketahui
- (kosong)

## Keputusan penting (detail di docs/keputusan.md)
- Status tampilan 5 kategori + mapping ke claim_status existing
- Baca-tulis claims yang sama (tanpa tabel baru)
- Gemini parsing lewat Edge Function diizinkan
- Hanya admin

## Hal baru yang dipelajari hari ini (dari penjelasan pemilik)
- Repo baru: https://github.com/esahuda9900/WEB-SDLG , base path /WEB-SDLG/
- Jawaban M0: status final 5 kategori OK, 240 = PFR + nomor urut list, boleh R/W claims, boleh Gemini, hanya admin

## Langkah berikutnya
1. Pemilik kasih OK untuk mulai M1
2. M1: scaffolding + backup darurat + deploy kosong ke Pages

## Commit stabil terakhir (untuk rollback)
- bf2719a — docs: catat keputusan M0
- 5ce594b — update STATUS M0
- e231512 — batas-gratis

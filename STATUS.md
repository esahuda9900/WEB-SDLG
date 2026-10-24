# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: **Parse PFR** (Edge Function + halaman web)
- Yang sedang dikerjakan: Deploy Pages + tes pemilik

## Catatan Estafet
- Sedang mengerjakan: Parse PFR
- Sudah sampai mana:
  - Edge Function `gemini-parse-claim` CORS diizinkan untuk GitHub Pages
  - Halaman `/klaim/parse`: tempel → parse → pratinjau → simpan/update
  - Parser lokal (tab PFR) aktif; Gemini fallback jika key terpasang di secret
- File / branch: main
- Langkah berikutnya: CI → pemilik tes parse

## Sudah selesai dan dites pemilik
- M1, M5 status, M6 edit, M7 baru, M8 arsip

## Sudah dibuat, belum dites pemilik
- M2–M4, M9 export, Parse PFR

## Langkah berikutnya
1. Tes Parse PFR di live
2. Helper copas form SDLG

## Commit stabil terakhir
- 9ed7e35 — M9 export

# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: **M5 Parse PFR (Gemini + validator)** — belum mulai implementasi aturan baru
- Parser regex lokal: **dihentikan sebagai solusi** (keputusan pemilik / diagnosis 2026-10-24)

## Bug / masalah yang diketahui
- 2026-10-24 — Ditemukan: Edge Function `gemini-parse-claim` v19 di Supabase TIDAK memanggil Gemini API. Input terstruktur mengembalikan `source-parser-fast`; jalur lain memakai parser lokal + warning. Implementasi berbeda dari dokumentasi M5 sebelumnya yang menyebut Gemini sebagai parser utama. Keputusan arah deterministic-primary + Gemini fallback masih pending sampai tes minimal 5 kasus tersamarkan lulus. Pemilik perlu mengetahui mismatch ini sebelum M5 lanjut.
- 2026-10-24 — Source Edge Function v19 sebelumnya belum ada di version control dan tidak ditemukan tes otomatis khusus di repo. Mirror ditambahkan pada branch `chore/mirror-edge-function`; belum di-merge/deploy.

## Catatan Estafet
- Sedang mengerjakan: dokumentasi syarat lulus parse
- Sudah sampai mana:
  - UI Parse + simpan ke claims ada
  - Percobaan regex gagal (label sebagai nilai, parts dobel, mileage salah)
  - Aturan parse + test case #1 dicatat di docs/ (tanpa teks PFR asli)
- File / branch: `chore/mirror-edge-function` (Commit 0 mirror; belum merge)
- Langkah berikutnya: pemilik review Commit 0; setelah disetujui, minta fixture PFR tersamarkan untuk commit 1 (failing test), lalu perbaiki satu bug per commit.

## Sudah selesai dan dites pemilik
- M1, status, edit, klaim baru, arsip

## Belum selesai / belum lulus
- Parse PFR akurat (M5)
- Export CSV formal
- Helper copas, cek warranty, Admin Center

## Hal baru yang dipelajari hari ini
- v19 deployed tidak memanggil Gemini; arah deterministic-primary + Gemini fallback masih pending tes 5 kasus
- Data PFR asli tidak masuk repo publik

## Commit stabil terakhir
- `51efe00f6e105aefa7c00268d542fea1401f4f86` — baseline main saat mirror dimulai
- `fa895812` — fix build parse (sebelum keputusan hentikan regex)

# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: **M5 Parse PFR (Gemini + validator)** — belum mulai implementasi aturan baru
- Parser regex lokal: **dihentikan sebagai solusi** (keputusan pemilik / diagnosis 2026-10-24)

## Catatan Estafet
- Sedang mengerjakan: dokumentasi syarat lulus parse
- Sudah sampai mana:
  - UI Parse + simpan ke claims ada
  - Percobaan regex gagal (label sebagai nilai, parts dobel, mileage salah)
  - Aturan parse + test case #1 dicatat di docs/ (tanpa teks PFR asli)
- File / branch: main
- Langkah berikutnya: implement M5 sesuai docs/keputusan.md + lulus docs/parse-test-cases.md

## Sudah selesai dan dites pemilik
- M1, status, edit, klaim baru, arsip

## Belum selesai / belum lulus
- Parse PFR akurat (M5)
- Export CSV formal
- Helper copas, cek warranty, Admin Center

## Hal baru yang dipelajari hari ini
- Jangan lanjutkan regex label-based; M5 = Gemini + validator + test case ketat
- Data PFR asli tidak masuk repo publik

## Commit stabil terakhir
- fa895812 — fix build parse (sebelum keputusan hentikan regex)

# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-30 oleh agent

## Posisi sekarang
- Milestone aktif: **M5 Parse PFR (Gemini + validator)** — belum mulai implementasi aturan baru
- Parser regex lokal: **dihentikan sebagai solusi** (keputusan pemilik / diagnosis 2026-10-24)
- **UI Detail Klaim**: layout diperbaiki (2 kolom + collapsible) — branch `feat/claim-detail-layout`

## Catatan Estafet
- Sedang mengerjakan: perbaikan layout halaman detail klaim (anti-overload)
- Sudah sampai mana:
  - Komponen `CollapsibleSection` (localStorage + visual beda state)
  - Layout 2 kolom (kiri utama, kanan total + ringkas)
  - Section collapsible dengan default open/closed sesuai preferensi pemilik
  - CSS dark theme diperbarui (surface-2, total-card, collapsible states)
- File / branch: `feat/claim-detail-layout`
- Langkah berikutnya: merge ke main → deploy → minta pemilik tes
- Keputusan yang belum final: tidak ada
- Bug yang sedang dilacak: tidak ada

## Sudah selesai dan dites pemilik
- M1, status, edit, klaim baru, arsip

## Sudah dibuat, belum dites pemilik
- Layout detail klaim baru (2 kolom + collapsible) — 2026-10-30

## Belum selesai / belum lulus
- Parse PFR akurat (M5)
- Export CSV formal
- Helper copas, cek warranty, Admin Center

## Hal baru yang dipelajari hari ini
- Preferensi pemilik: collapsible > tab untuk data admin; total harus menonjol; jangan tiru layout padat sistem referensi

## Langkah berikutnya
1. Merge PR layout detail → CI → deploy
2. Minta pemilik tes halaman detail klaim
3. Lanjut M5 Parse PFR (Gemini)

## Commit stabil terakhir (untuk rollback)
- 51efe00f — sebelum layout detail baru
- fa895812 — fix build parse (sebelum keputusan hentikan regex)

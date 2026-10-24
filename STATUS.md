# STATUS.md — Kondisi project terkini
Terakhir diperbarui: 2026-10-24 oleh agent

## Posisi sekarang
- Milestone aktif: **M5 — Ubah status klaim**
- Yang sedang dikerjakan: Panel ubah status di branch `feature/m5-ubah-status`

## Catatan Estafet
- Sedang mengerjakan: M5
- Sudah sampai mana:
  - Form ubah claim_status di detail (admin)
  - Catatan/alasan; wajib jika Rejected
  - Update status_date + last_updated
  - Tidak ubah struktur DB
  - Belum PR/merge
- File / branch: feature/m5-ubah-status
- Langkah berikutnya: PR → merge → deploy → pemilik tes pada klaim Draft

## Sudah selesai dan dites pemilik
- M1 fondasi

## Sudah dibuat, belum dites pemilik
- M2–M5 (M5 di branch)

## Langkah berikutnya
1. PR M5 → merge → deploy
2. Tes ubah status (lebih aman di klaim Draft)

## Commit stabil terakhir
- adfb674 — STATUS M4 menunggu tes

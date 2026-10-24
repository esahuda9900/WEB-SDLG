# Backup darurat (M1)

Supabase Free **tidak punya** backup otomatis. Sebelum migration struktur database apa pun, wajib ada cara memulihkan data.

## Rencana (disetujui di M1, implementasi bertahap)

1. **Sekarang (M1):** Dokumentasi ini + catatan di STATUS. Belum ada migration.
2. **Sebelum migration pertama:**
   - Buat Edge Function admin-only `export-backup` yang mengekspor tabel inti (claims, machines, customers, policy, …) ke JSON.
   - Admin menekan tombol di Admin Center → unduh file JSON + timestamp.
   - Simpan file di tempat aman di luar repo (Drive pribadi / folder lokal).
3. **Alternatif darurat:** Export manual dari Supabase Dashboard (Table Editor → Export) untuk tabel kritis sebelum migration.
4. **Restore:** Import JSON lewat Edge Function atau SQL yang disiapkan agent (tampilkan dulu, tunggu OK).

Lokasi file backup **tidak** disimpan di repo publik.

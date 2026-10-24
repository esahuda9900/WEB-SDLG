# docs/roles.md

## Saat ini (M2)
- Hanya role **admin** (dan warranty_admin) yang boleh masuk web baru.
- Public signup dimatikan di UI (tidak ada form daftar).
- Role disimpan di tabel `public.app_user_roles` (PK: user_id).

## Role yang didukung constraint DB
- admin
- warranty_admin
- viewer
- branch_user

## Catatan
- 2026-10-24: user `esahuda9900@gmail.com` diset role admin (atas OK pemilik).
- Role cabang / TS / atasan menyusul di milestone nanti.

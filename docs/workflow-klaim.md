# Alur klaim warranty SDLG

1. Customer punya unit rusak dan melapor ke cabang dealer.
2. Cabang cek apakah unit masih warranty (tanggal dan hour meter). Kalau masih, mekanik datang mengecek kondisi unit.
3. Kalau penyebabnya kesalahan customer: bukan warranty. Kalau cacat produksi: bisa diwarranty.
4. Cabang membuat pre-PFR (Product Failure Report sebelum repair) dan mengirim ke Technical Support (TS) di HO.
5. TS memberi persetujuan awal dari sisi dealer. Kalau bukan warranty: ditolak dan dikembalikan ke customer.
6. Kalau disetujui, cabang memperbaiki unit di customer.
7. Setelah selesai, cabang membuat PFR final dan mengirim ke TS.
8. TS menyetujui PFR final dan mengirim email ke admin warranty (pemilik project ini): tolong submit ke SDLG.
9. MULAI DARI SINI ADALAH LINGKUP WEB: admin warranty memasukkan klaim ke web ini (tempel teks PFR, parse, simpan). Klaim masuk daftar belum disubmit.
10. Admin submit klaim ke web SDLG (principal) secara manual per field, dibantu helper copas.
11. Setelah submit, admin memperbarui PFR (sekarang berisi nomor SDLG dan tanggal klaim), lalu menempelnya lagi ke web ini. Klaim yang sama ter-update dan statusnya menjadi sudah disubmit.
12. SDLG mengaudit klaim: hasilnya diaudit (disetujui) atau ditolak dengan alasan. Admin memperbarui status, manual atau lewat import Excel dari web SDLG.

Identitas klaim: nomor PFR dealer (format mirip PFR-061-SDLG-2026). Nomor SDLG baru muncul setelah submit.
Status yang direncanakan: Belum disubmit, Sudah disubmit, Diaudit SDLG, Ditolak (dengan catatan alasan). Klaim arsip terpisah. Agent wajib memastikan daftar status final ini ke pemilik di M0.
Data unit dan policy warranty sudah ada di Supabase. Parsing PFR dipakai dua kali: untuk klaim baru dan untuk update klaim yang sudah ada.

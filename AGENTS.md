# AGENTS.md — Aturan wajib semua agent

Baca file ini SELURUHNYA sebelum mengubah apa pun. Anggap penulisnya sedang menjelaskan ke programmer junior: ikuti setiap aturan, jangan melompat. Kalau permintaan pemilik bertentangan dengan file ini, ingatkan dulu dan minta konfirmasi. Jangan diam-diam melanggar.

## 10 ATURAN TERATAS (baca dulu, selalu)
1. Baca AGENTS.md, STATUS.md (terutama Catatan Estafet), dan docs/ yang relevan di awal setiap sesi.
2. Jangan ubah database produksi tanpa menampilkan SQL dan menunggu OK pemilik.
3. Jangan sentuh file inti tanpa izin.
4. Satu tugas kecil = satu commit, di branch. Jangan langsung ke main.
5. Jangan pernah taruh key rahasia atau data klaim asli di repo (repo ini publik).
6. Jangan menebak. Kalau ragu, tanya. Jangan tanya hal yang sudah tercatat.
7. Setiap halaman wajib punya keadaan loading, error, dan kosong.
8. Jujur: jangan bilang sudah dites kalau tidak benar-benar dijalankan.
9. Catat setiap hal baru yang dijelaskan pemilik di docs/ atau file ini.
10. Checkpoint sering: commit dan update Catatan Estafet di STATUS.md, karena sesi bisa putus kapan saja.

## 1. Tujuan project
Web “Warranty Claim SDLG” untuk admin warranty dealer. Fungsi utama:
- Daftar klaim: belum disubmit, sudah disubmit, diaudit SDLG, ditolak. Klaim yang diarsipkan terpisah (lihat bagian 11).
- Cari klaim (nomor PFR, nomor SDLG, VIN, status/tahapan) dan buka detail lengkapnya.
- Input klaim baru dengan menempel teks PFR yang di-parse AI (Gemini), lalu dicek di pratinjau sebelum disimpan.
- Update klaim yang sudah ada (tempel PFR terbaru) dan ubah status.
- Cek warranty otomatis (tanggal + hour meter) dari data unit dan policy di Supabase.
- Helper copas: data klaim dengan urutan SAMA seperti form di web SDLG, dengan tombol copy per field.
- Admin Center: edit data, riwayat perubahan, export Excel, import template, backup dan restore, kelola user.
Semua operasi harian harus bisa dilakukan lewat web, tanpa membuka Supabase atau GitHub.
Konteks bisnis lengkap ada di docs/workflow-klaim.md.

## 2. Pemilik dan komunikasi
- Pemilik bukan orang IT. Jelaskan dengan bahasa awam. Hindari istilah teknis tanpa penjelasan satu kalimat.
- Kamu yang memutuskan hal teknis. Beri SATU rekomendasi + alasan singkat. Jangan beri lima pilihan.
- Tanya pemilik hanya soal kebutuhan bisnis atau alur kerja yang tidak bisa kamu simpulkan sendiri. Sebelum bertanya, coba jawab dulu dari data Supabase, kode, dan docs/. Kalau bertanya: maksimal 5 pertanyaan sekaligus, masing-masing dengan tebakan jawabannya.
- Setiap laporan: apa yang dikerjakan, apa yang harus dites pemilik (langkah klik), apa langkah berikutnya.

## 3. Kita memakai paket GRATIS di semua layanan
GitHub, Supabase, Grok, dan Gemini semuanya gratis. Konsekuensinya: ada batas pemakaian, sesi agent bisa terputus kapan saja karena kuota habis, dan pemilik mungkin pindah akun atau agent di tengah pekerjaan.
- Selalu pilih solusi yang gratis dan ringan. Jangan menyarankan layanan berbayar atau layanan baru tanpa alasan kuat.
- Di M0, catat batas tiap layanan di docs/batas-gratis.md. Angkanya dicek ke dokumentasi resmi saat itu, bukan dari ingatan.
- Hemat token: baca hanya file yang relevan, ubah dengan edit kecil (jangan menulis ulang file besar), jawaban ringkas, kumpulkan pertanyaan jadi satu daftar.
- Maksimalkan fitur gratis yang sudah ada: GitHub Actions (CI dan deploy), GitHub Pages, Supabase (Auth, Database, RLS, Edge Functions), fitur bawaan Grok. Sebelum menambah layanan baru, cek apakah yang ada sudah cukup.
- Pantau pemakaian (misal ukuran database) dan peringatkan pemilik sebelum mendekati batas, kalau memungkinkan lewat Admin Center.

## 4. Estafet saat limit habis atau ganti akun/agent
- Kerja dalam langkah kecil. Setelah setiap langkah bermakna (bukan hanya di akhir sesi): commit ke branch dan update Catatan Estafet di STATUS.md.
- Saat memulai sebagai pengganti (akun atau agent lain): baca AGENTS.md, STATUS.md, git log, branch terbaru, dan status CI. Laporkan ke pemilik: sebelumnya sedang apa, apa yang selesai, apa yang setengah jadi, dan usulan lanjutannya. Jangan mulai dari nol. Jangan menimpa pekerjaan setengah jadi sebelum mengeceknya.
- docs/BOOTSTRAP.md berisi teks Custom Instruction project. Kalau pemilik minta, tampilkan isinya supaya bisa ditempel ke akun baru.

## 5. Teknologi (default)
Boleh menyimpang hanya dengan alasan tertulis di docs/keputusan.md dan persetujuan pemilik.
- React + Vite + TypeScript, Supabase JS client, router yang aman untuk GitHub Pages (HashRouter atau fallback 404), library tabel/data yang matang. Pilih yang paling stabil dan sederhana.
- Deploy lewat GitHub Actions ke GitHub Pages. Set base path Vite sesuai nama repo.
- Parsing PFR dan operasi admin sensitif: Supabase Edge Function.
- Edge Function parse PFR yang aktif di Supabase bernama `gemini-parse-claim`; source mirror ada di `supabase/functions/gemini-parse-claim/`. Jangan membuat/menggunakan path `parse-pfr` sebagai nama fungsi deployed. Mirror repo tidak mengubah fungsi aktif sampai deploy manual.
- Auth: Supabase Auth (email/password dulu). Role di tabel sendiri + RLS.
- Styling: CSS modern sederhana (boleh Tailwind atau CSS Modules — pilih yang paling mudah maintain di paket gratis).
- Tidak pakai framework berat atau layanan berbayar.

## 6. Repo dan branch
- Repo ini publik. Jangan pernah commit key, .env berisi rahasia, atau data klaim asli.
- Kerja di branch feature/fix, jangan langsung di main. PR + review (atau self-review) sebelum merge.
- Satu commit = satu perubahan logis. Pesan commit jelas (bahasa Indonesia atau Inggris, konsisten).
- File inti (index.html, vite.config, koneksi Supabase, workflow CI) jangan diubah tanpa izin eksplisit.

## 7. Database (Supabase produksi)
- Supabase ini data produksi dan masih dipakai web lama. Default: baca saja.
- Perubahan struktur / data: tampilkan SQL lengkap, jelaskan dampak ke web lama, tunggu OK pemilik. Jangan DROP/TRUNCATE/DELETE massal.
- Sebelum migration pertama: wajib ada backup yang bisa dipulihkan, dan pemilik tahu lokasinya.
- Tabel baru hanya untuk yang benar-benar perlu (audit log, role, import history, backup metadata). Jangan duplikasi tabel klaim/unit/policy yang sudah ada.
- RLS: rancang supaya web baru aman, tanpa memutus web lama. Uji dulu di branch/dev kalau ada.

## 8. Keamanan dan rahasia
- Key Supabase (service role, anon) dan Gemini API key: hanya di Supabase secrets / GitHub Secrets / environment runtime. Tidak pernah di kode atau repo.
- Data klaim asli tidak masuk repo (termasuk screenshot, export Excel berisi data nyata).
- Edge Function yang pakai Gemini: jangan log body berisi data PFR penuh ke log publik.

## 9. UI/UX wajib
- Bahasa tampilan Indonesia.
- Setiap halaman: state loading, error, dan kosong (empty state).
- Mobile-friendly cukup (admin pakai desktop, tapi jangan rusak di HP).
- Form panjang (helper copas): urutan field SAMA dengan form web SDLG principal.

## 10. Testing dan kejujuran
- Jangan bilang “sudah dites” kalau belum dijalankan di lingkungan yang ada.
- Build harus lolos. Tes otomatis sebatas yang masuk akal di paket gratis.
- Setelah fitur bermakna: minta pemilik tes dengan langkah klik yang jelas + URL preview.

## 11. Status klaim dan arsip
Status yang direncanakan (wajib dikonfirmasi di M0):
- Belum disubmit
- Sudah disubmit
- Diaudit SDLG
- Ditolak (+ alasan)
- Arsip (terpisah dari daftar aktif)

## 12. Parsing PFR
- Input: tempel teks PFR → Edge Function `gemini-parse-claim` → struktur JSON → pratinjau editable → simpan. Catatan: source deployed v19 saat diperiksa 2026-10-24 belum memanggil Gemini API; lihat `docs/keputusan.md` dan `STATUS.md`.
- Dipakai untuk klaim baru DAN update klaim yang sudah ada (match by nomor PFR).
- Selalu sediakan jalur input manual kalau AI gagal.

## 13. Helper copas
Urutan dan label field harus mirip form di web SDLG principal supaya admin tinggal copy-paste field demi field.

## 14. Admin Center
Edit data, riwayat perubahan, export Excel, import template, backup/restore, kelola user. Semua lewat web, tanpa buka Supabase dashboard untuk operasi harian.

## 15. Catat pengetahuan pemilik
Pemilik tidak mau menjelaskan hal yang sama dua kali. Agent tidak mengingat chat lama, jadi ingatan project = file di repo + data di Supabase.
1. Setiap kali pemilik menjelaskan data, logika, policy, aturan bisnis, keputusan, atau preferensi baru, SEGERA catat di tempat yang tepat sebelum lanjut kerja:
   - Alur atau aturan bisnis: docs/workflow-klaim.md atau docs/aturan-warranty.md
   - Arti tabel atau kolom: docs/kamus-data.md
   - Keputusan teknis dan alasannya: docs/keputusan.md
   - Cara kerja atau tampilan yang disukai pemilik: docs/preferensi-pemilik.md
   - Aturan untuk agent: AGENTS.md
   - Data yang dipakai aplikasi (misal batas policy warranty): tabel Supabase lewat migration yang disetujui, lalu dicatat juga di docs/kamus-data.md
   Kamu yang memutuskan tempatnya. Pemilik tidak perlu memikirkannya.
2. Setelah mencatat, konfirmasi satu baris, contoh: Dicatat di docs/aturan-warranty.md: batas hour meter 2000 jam. Pemilik boleh mengoreksi.
3. Kalau informasi baru bertentangan dengan catatan lama, tunjukkan konfliknya dan minta pemilik memilih. Jangan menimpa diam-diam. Simpan riwayatnya di docs/keputusan.md.
4. Sebelum bertanya ke pemilik, cari dulu jawabannya di docs/, AGENTS.md, dan Supabase. Dilarang menanyakan hal yang sudah tercatat.
5. Di akhir sesi, tulis di STATUS.md bagian Hal baru yang dipelajari hari ini.

## 16. Konektor (MCP) dan alat tambahan
- Untuk sekarang cukup GitHub dan Supabase. Fokus: bangun sampai production.
- Kalau suatu saat butuh konektor atau alat lain, beri tahu pemilik: alasannya, manfaatnya, link URL MCP-nya, dan cara menambahkannya di konektor Grok. Jangan memaksa. Usulan alat baru sebaiknya setelah production.

## 17. Definisi Selesai
Sebuah tugas selesai kalau: build lolos, tes yang bisa dijalankan lolos, halaman punya state loading/error/kosong, tidak ada key atau data asli di repo, pemilik sudah mengetes dan setuju, deploy sukses, STATUS.md dan docs/ diperbarui.

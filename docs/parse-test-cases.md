# docs/parse-test-cases.md

Syarat lulus parse PFR (M5). Teks PFR asli **tidak** disimpan di repo. Pemilik menyimpan asli lokal; di sini hanya **hasil yang diharapkan** (sebagian disamarkan).

## Case #1 — Starter Motor (syarat lulus M5)

Nomor PFR contoh: `0256-2026-SDLG-PFR` (boleh diganti di data uji).

| Field | Nilai yang benar |
|-------|------------------|
| No. PFR | 0256-2026-SDLG-PFR |
| Model | SDLG G9220F |
| Serial | S0600967 |
| Engine serial | 60834594 |
| Indent / build no | G2200L2244106E3 |
| Customer | (disamarkan di fixture; contoh: PT. Contoh Customer) |
| Cabang | null / kosong |
| Dealer name | (disamarkan; contoh: PT. Contoh Dealer) |
| Dealer code | 138660 |
| No. klaim dealer | FW2610150008 |
| WO / SO | WO26044457 |
| App code | null |
| No. SDLG | null (bukan teks "Distributor No:") |
| Tanggal jual | 2026-05-08 |
| Tanggal gagal | 2026-10-01 |
| Mulai perbaikan | 2026-10-01 |
| Selesai perbaikan | 2026-10-01 |
| Tanggal klaim dealer | 2026-10-15 |
| HM gagal | 1947 |
| HM selesai | 1947 |
| Deskripsi kerusakan | Starter Motor Can Not Work |
| Metode perbaikan | Replace With New Starter Motor |
| Part no penyebab | SLG-4110003380073 |
| Deskripsi part | Starter Motor |
| Teknisi | PRIYO And DHANI |
| Labour (jam) | 4 |
| Mileage (km) | **368** (bukan 184 dari catatan bawah) |
| Parts total | 224 |
| Total | 224 |
| Mata uang | USD |

### Parts (wajib tepat 1 baris)

| Part no | Deskripsi | Qty | Harga | Jumlah |
|---------|-----------|-----|-------|--------|
| SLG-4110003380073 | Starter Motor | 1 | 224 | 224 |

### Yang TIDAK boleh terjadi
- Nilai berupa label (`Distributor`, `Distributor No:`, ` No:`)
- Placeholder (`dd/mm/yyyy`)
- Parts lebih dari 1 baris / dobel dari Causing Part
- Mileage = 184
- Labour kosong

### Cara uji
1. Pemilik tempel teks PFR case #1 (lokal) di halaman Parse.
2. Bandingkan pratinjau dengan tabel di atas.
3. Kalau belum cocok → M5 belum selesai.

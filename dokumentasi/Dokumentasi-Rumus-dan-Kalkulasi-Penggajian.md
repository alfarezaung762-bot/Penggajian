# Dokumentasi Master Rumus & Arsitektur Kalkulasi Penggajian (Payroll Engine)

Dokumen ini menjelaskan secara menyeluruh seluruh rumus matematika, logika bisnis, serta alur kalkulasi penggajian yang diterapkan pada sistem aplikasi penggajian (termasuk penjelasan perbedaan **Mode Potongan Otomatis vs Manual**).

---

## 1. Rumus Perhitungan Slip Gaji Per Karyawan (Take Home Pay)

Uang yang benar-benar dibawa pulang oleh **1 orang karyawan** dan masuk ke rekening bank mereka setiap bulan (**Take Home Pay**) dihitung dengan rumus sederhana:

**Gaji Bersih (Take Home Pay) = Total Pendapatan (Uang Diterima Karyawan) - Total Potongan (Kewajiban & Denda)**

---

### 📂 Pemetaan Nama Fitur UI/UX dengan Berkas Kode Sumber (Source Code):

Agar tidak bingung, berikut adalah pemetaan antara **Nama Menu di Layar Tampilan (UI/UX)** dengan **Berkas Kode Backend & Frontend** yang menjalankannya:

| Nama Menu Layar (UI/UX) | Lokasi Halaman (URL) | Berkas Kode Utama (Backend / Service) | Fungsi / Keterangan Operasional |
|---|---|---|---|
| 💵 **Proses Penggajian (Payroll)** | `/kelola_hrd_admin/payroll` | [`lib/services/payroll-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/payroll-service.ts)<br/>`app/api/call_payroll/route.ts` | **Mesin Penghitung Utama Payroll**: Tempat Admin menekan *Hitung Payroll* untuk menjalankan kalkulasi seluruh pendapatan & potongan karyawan, serta membekukan status (*Lock Periode*). |
| ⏰ **Tarif Lembur** | `/kelola_hrd_admin/tarif-lembur` | [`lib/services/lembur-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/lembur-service.ts) | Menghitung upah lembur per jam, multiplier lembur hari kerja (1.5x, 2.0x), & hari libur (2.0x, 3.0x, 4.0x). |
| ✂️ **Potongan Gaji & Absensi** | `/kelola_hrd_admin/potongan-gaji` | [`lib/services/absensi-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/absensi-service.ts) | Menghitung denda sanksi ketidakhadiran tanpa izin secara otomatis (`Hari Alpha x (Gaji Pokok / 30)`). |
| 🏛️ **Kalkulator Pajak PPh 21** | Terintegrasi di Engine | [`lib/services/pph21-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/pph21-service.ts) | Menghitung Biaya Jabatan (5%), PTKP (TK/0 s/d K/3), PKP, & Tarif Progresif Pajak PPh 21 (5%, 15%, 25%, 30%). |
| 📄 **Laporan Gaji (BNI Transfer)** | `/kelola_hrd_admin/laporan-gaji` | `app/api/laporan-gaji/route.ts`<br/>[`lib/services/pdf-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/pdf-service.ts) | Rekapitulasi pencairan dana seluruh karyawan & cetak PDF instruksi transfer Bank BNI. |
| 📄 **Slip Gaji Saya** | `/karyawan/slip-gaji` | [`app/(dashboard)/karyawan/slip-gaji/page.tsx`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/app/%28dashboard%29/karyawan/slip-gaji/page.tsx) | Portal karyawan untuk melihat rincian gaji pribadi & mengunduh PDF slip gaji resmi. |

---

### 🧩 Penjabaran Lengkap Rumus Bahasa Awam:

Jika rumus di atas dibongkar satu per satu seluruh komponen isinya, maka persamaannya adalah:

**Gaji Bersih (Uang Ditransfer ke Rekening Karyawan)** =  
**(Gaji Pokok + Tunjangan Jabatan + Uang Makan + Upah Lembur + Tunjangan Lain)** — *(Total Pendapatan / Uang Masuk)*  
**-**  
**(BPJS + Potongan Alpha + PPh 21 + Potongan Lain)** — *(Total Potongan / Uang Keluar)*

---

### 💡 Penjelasan Bahasa Manusia (Bukan Bahasa Sistem):

#### **A. TOTAL PENDAPATAN (Semua Uang Masuk yang Menjadi Hak Karyawan)**
Yaitu penjumlahan seluruh uang yang berhak didapatkan karyawan pada bulan tersebut:
1. **Gaji Pokok**: Standar upah dasar bulanan sesuai posisi/jabatan karyawan.
2. **Tunjangan Jabatan**: Uang tambahan atas beban tanggung jawab posisi, jabatan manajerial, atau keahlian khusus.
3. **Uang Makan**: Total uang makan bulanan, dihitung dari tarif makan per hari dikali jumlah hari kerja yang diikuti karyawan.
4. **Upah Lembur**: Uang tambahan jika karyawan bekerja melebihi jam kerja normal (dihitung per jam sesuai aturan ketenagakerjaan).
5. **Tunjangan Lain**: Bonus tambahan dari perusahaan (seperti THR, bonus kinerja, atau tunjangan khusus).

#### **B. TOTAL POTONGAN (Semua Uang Keluar yang Harus Dipotong)**
Yaitu penjumlahan seluruh kewajiban iuran, pajak, dan denda yang memotong gaji kotor karyawan:
1. **Potongan BPJS**: Iuran wajib jaminan sosial karyawan (BPJS Kesehatan 1%, BPJS Hari Tua/JHT 2%, dan BPJS Pensiun/JP 1%).
2. **Potongan Alpha**: Denda pemotongan gaji akibat karyawan tidak hadir bekerja tanpa surat izin/keterangan yang sah.
3. **Potongan PPh 21**: Pajak penghasilan resmi karyawan yang disetorkan ke kas negara (dihitung otomatis sesuai batas PTKP & status nikah/tanggungan).
4. **Potongan Lain (Kategori Kustom)**: Jenis potongan bebas yang ditambahkan oleh HRD pada menu **Potongan Gaji** (`kategori: kustom`), seperti *Potongan Koperasi*, *Potongan Seragam*, *Potongan Denda*, atau potongan kustom lainnya.

---

### 🔢 Contoh Perhitungan Praktis:
Misalkan bulan ini seorang karyawan memiliki rincian sebagai berikut:
- **Total Uang Masuk (Pendapatan)**: Gaji Pokok Rp 7.000.000 + Tunjangan Jabatan Rp 1.000.000 + Uang Makan Rp 500.000 = **Rp 8.500.000**
- **Total Uang Keluar (Potongan)**: Iuran BPJS Rp 280.000 + Pajak PPh 21 Rp 162.500 = **Rp 442.500**
- **Uang Bersih yang Ditransfer (Take Home Pay)**:  
  **Rp 8.500.000 (Total Pendapatan) - Rp 442.500 (Total Potongan) = Rp 8.057.500**

---

## 2. Komponen Pendapatan (Earnings)

Total Pendapatan dihitung dengan mengumpulkan 5 komponen utama:

**Total Pendapatan = Gaji Pokok + Tunjangan Jabatan + Uang Makan + Upah Lembur + Tunjangan Lain**

| Komponen | Kode Service | Cara & Rumus Perhitungan |
|---|---|---|
| **1. Gaji Pokok** | `payroll-service.ts` | Diambil langsung dari nilai nominal `gaji_pokok` pada Master Jabatan karyawan. |
| **2. Tunjangan Jabatan (Tanggung Jawab & Struktural)** | `payroll-service.ts` | Diambil dari `tunjangan_jabatan` pada Master Jabatan. Mencakup kompensasi tanggung jawab posisi, level manajerial, dan keahlian struktural. |
| **3. Uang Makan** | `payroll-service.ts` | `Nominal Uang Makan per Hari (dari Jabatan) x Jumlah Hari Kehadiran Sah` (Hadir/Cuti/Sakit). |
| **4. Upah Lembur** | `lembur-service.ts` | **a. Tarip per Jam**: `Upah per Jam = (1 / 173) x (Gaji Pokok + Tunjangan Jabatan)`<br/>**b. Jam Lembur Hari Kerja**: Jam ke-1 = `1.5 x Upah per Jam`, Jam ke-2 dst = `2.0 x Upah per Jam`.<br/>**c. Jam Lembur Hari Libur**: Jam 1-7 = `2.0 x Upah per Jam`, Jam ke-8 = `3.0 x Upah per Jam`, Jam ke-9+ = `4.0 x Upah per Jam`. |
| **5. Tunjangan Lainnya** | `payroll-service.ts` | Tunjangan kustom tambahan (misal: Bonus Kinerja, THR, Tunjangan Transportasi) yang dibuat oleh Admin. |

> 📌 **Catatan Penting Pengaruh Lembur terhadap Pajak PPh 21**:
> - **Upah Lembur menambah Total Gaji Kotor (Bruto)**: Jika Gaji Pokok Rp 6 Juta + Lembur Rp 2 Juta = Gaji Kotor Rp 8.000.000.
> - Angka **Rp 8.000.000 inilah** yang dimasukkan ke kalkulator PPh 21, sehingga pajak PPh 21 pada bulan tersebut otomatis menyesuaikan sedikit lebih tinggi sesuai penghasilan riil bulan itu.
> - **Potongan Alpha**: Berfungsi sebagai denda pemotongan pada kelompok **Total Potongan (Deductions)** yang mengurangi Gaji Kotor untuk menghasilkan Gaji Bersih (Take Home Pay).

---

## 3. Komponen Potongan Gaji (Deductions — Otomatis vs Manual)

Total Potongan dihitung dari penjumlahan 4 jenis pemotongan:

**Total Potongan = Potongan BPJS + Potongan Alpha + Potongan PPh 21 + Potongan Kustom**

### 📌 A. Mode Hitung MANUAL (Configured Rate / Fixed Percentage)
Menggunakan patokan nilai tetap persentase (%) atau nominal yang telah diatur oleh HRD di Master Potongan. Sistem menghitung berdasarkan perkalian persentase terhadap Gaji Pokok.

1. **BPJS Kesehatan (1%)**: `Potongan BPJSKes = 1% x Gaji Pokok`
2. **BPJS Ketenagakerjaan JHT (2%)**: `Potongan JHT = 2% x Gaji Pokok`
3. **BPJS Ketenagakerjaan JP (1%)**: `Potongan JP = 1% x Gaji Pokok`
4. **Potongan Kustom / Pinjaman**: Nominal fixed (misal denda Rp 50.000 atau iuran seragam Rp 50.000).

---

### 📌 B. Mode Hitung OTOMATIS (Dynamic System Algorithm)
Dihitung secara dinamis oleh rumus algoritma backend saat kalkulasi payroll dijalankan, **tanpa perlu dihitung manual oleh HRD**.

1. **Potongan Alpha (Absen Tanpa Keterangan)** (`absensi-service.ts`):  
   `Potongan Alpha = Total Hari Alpha x (Gaji Pokok / 30 Hari)`  
   *Sistem secara otomatis menghitung berapa hari karyawan tidak hadir tanpa keterangan pada periode tersebut dari tabel absensi.*

2. **PPh 21 Pajak Penghasilan** ([`lib/services/pph21-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/pph21-service.ts)):
   - 📂 **Lokasi Berkas Kode Perhitungan**:
     - **Rumus PTKP & Pajak**: [`lib/services/pph21-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/pph21-service.ts) (Fungsi `hitungPTKP` & `hitungPPh21Bulanan`).
     - **Pemanggilan di Engine Payroll**: [`lib/services/payroll-service.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/payroll-service.ts) (Line 90-94).
     - **Tampilan Kode Status PTKP Slip Gaji**: [`app/api/payroll/route.ts`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/app/api/payroll/route.ts) & [`app/(dashboard)/karyawan/slip-gaji/page.tsx`](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/app/%28dashboard%29/karyawan/slip-gaji/page.tsx).

   - **Tahap 1 (Biaya Jabatan & Neto)**:  
     `Biaya Jabatan = 5% x Gaji Bruto Bulanan (Maksimal Rp 500.000)`  
     `Neto Tahunan = (Gaji Bruto Bulanan - Biaya Jabatan) x 12 Bulan`
   - **Tahap 2 (PTKP & PKP)**:  
     `PTKP` (Penghasilan Tidak Kena Pajak) adalah **Batas Bebas Pajak Resmi Pemerintah** yang ditentukan oleh status pernikahan dan jumlah tanggungan anak (Maksimal 3 Anak):
     
     | Kode Status PTKP | Singkatan & Kepanjangan | Jumlah Tanggungan | Batas Bebas Pajak (PTKP / Tahun) |
     |---|---|---|---|
     | **TK/0** | Tidak Kawin (Lajang) | 0 Tanggungan | **Rp 54.000.000** |
     | **TK/1** | Tidak Kawin (Lajang) | 1 Tanggungan | **Rp 58.500.000** |
     | **TK/2** | Tidak Kawin (Lajang) | 2 Tanggungan | **Rp 63.000.000** |
     | **TK/3** | Tidak Kawin (Lajang) | 3 Tanggungan (Maks) | **Rp 67.500.000** |
     | **K/0** | Kawin (Menikah) | 0 Tanggungan | **Rp 58.500.000** |
     | **K/1** | Kawin (Menikah) | 1 Tanggungan | **Rp 63.000.000** |
     | **K/2** | Kawin (Menikah) | 2 Tanggungan | **Rp 67.500.000** |
     | **K/3** | Kawin (Menikah) | 3 Tanggungan (Maks) | **Rp 72.000.000** |

     *Rumus PKP (Penghasilan Kena Pajak) = Neto Tahunan - Nilai PTKP Sesuai Kategori.*
   - **Tahap 3 (Tarif Progresif Tahunan)**:  
     - Lapisan 1 (Rp 0 s/d Rp 60 Juta): 5%  
     - Lapisan 2 (Rp 60 Juta s/d Rp 250 Juta): 15%  
     - Lapisan 3 (Rp 250 Juta s/d Rp 500 Juta): 25%  
     - Lapisan 4 (> Rp 500 Juta): 30%
   - **Tahap 4 (Potongan Bulanan)**:  
     `PPh 21 Bulanan = Total Pajak Tahunan / 12 Bulan`

---

## 4. Simulasi Studi Kasus Riil Nyata: Perbandingan Karyawan A vs Karyawan B

Untuk memahami secara jelas perbedaan **Mode MANUAL** dan **Mode OTOMATIS**, mari kita lihat contoh operasional riil dua orang karyawan di **PT Santoso Makmur Jaya** pada bulan Agustus:

---

### 👤 Profil 2 Karyawan:

| Parameter Karyawan | 👨‍💼 Karyawan A (Budi - Staff Marketing) | 👩‍💼 Karyawan B (Siti - Staff Operasional) |
|---|---|---|
| **Gaji Pokok** | **Rp 6.000.000** | **Rp 6.000.000** |
| **Status PTKP / Tanggungan** | **TK/0** (Lajang tanpa tanggungan) | **K/1** (Menikah + 1 anak) |
| **Riwayat Absensi Bulan Ini** | **Hadir Penuh (0 Hari Alpha)** | **Bolos 2 Hari Tanpa Izin (2 Hari Alpha)** |

---

### ⚙️ Perbandingan Proses Perhitungan Potongan (Manual vs Otomatis):

#### **1. Potongan BPJS Kesehatan (MODE MANUAL — HRD Cuma Setting 1x di Master)**
- HRD sudah mengatur di Master Potongan: `BPJS Kesehatan = 1%`.
- **Hasil Karyawan A (Budi)**: `1% x Rp 6.000.000 = Rp 60.000`
- **Hasil Karyawan B (Siti)**: `1% x Rp 6.000.000 = Rp 60.000`
- 💡 *Penjelasan*: HRD **tidak perlu ngitung ulang**. Sistem mengambil rumus patokan 1% yang di-setting HRD di master untuk siapapun.

---

#### **2. Potongan Alpha / Denda Bolos (MODE OTOMATIS — Dihitung Mesin dari Database Absensi)**
- HRD **tidak mengisi angka apapun** pada formulir potongan.
- **Hasil Karyawan A (Budi)**:
  - Mesin membaca database absensi Budi ➔ `0 Hari Alpha`.
  - Potongan Alpha Budi = `0 x (Rp 6.000.000 / 30) = Rp 0` *(Tidak dipotong karena tidak pernah bolos)*.
- **Hasil Karyawan B (Siti)**:
  - Mesin membaca database absensi Siti ➔ `Ditemukan 2 Hari Alpha` (tanggal 12 & 19 Agustus).
  - Potongan Alpha Siti = `2 Hari x (Rp 6.000.000 / 30 Hari) = Rp 400.000` *(Dipotong Rp 400.000 secara otomatis)*.
- 💡 *Penjelasan*: HRD **tidak perlu ngitung hari bolos Siti secara manual**. Sistem membaca sendiri data tap absensi Siti dan langsung memotong gajinya Rp 400.000.

---

#### **3. Potongan Pajak PPh 21 (MODE OTOMATIS — Dihitung Mesin dari Data Profil PTKP)**
- HRD **tidak pernah mengisi angka pajak** di formulir.
- **Rincian Perhitungan Mesin Backend**:
  - **Karyawan A (Budi - Status TK/0 / Lajang Tanpa Tanggungan)**:
    - Gaji Bruto = Rp 6.000.000
    - Biaya Jabatan (5%) = Rp 300.000 ➔ Neto Tahunan = `(6.000.000 - 300.000) x 12 = Rp 68.400.000`
    - Batas Tidak Kena Pajak (**PTKP TK/0**) = **Rp 54.000.000**
    - Penghasilan Kena Pajak (**PKP**) = `68.400.000 - 54.000.000 = Rp 14.400.000`
    - Pajak PPh 21 Tahunan (5% x 14.400.000) = Rp 720.000 ➔ **Pajak Bulanan = Rp 60.000**
  - **Karyawan B (Siti - Status K/1 / Menikah + 1 Anak)**:
    - Gaji Bruto = Rp 6.000.000
    - Biaya Jabatan (5%) = Rp 300.000 ➔ Neto Tahunan = `Rp 68.400.000`
    - Batas Tidak Kena Pajak (**PTKP K/1**) = Rp 54jt (Dasar) + Rp 4.5jt (Kawin) + Rp 4.5jt (1 Anak) = **Rp 63.000.000**
    - Penghasilan Kena Pajak (**PKP**) = `68.400.000 - 63.000.000 = Rp 5.400.000`
    - Pajak PPh 21 Tahunan (5% x 5.400.000) = Rp 270.000 ➔ **Pajak Bulanan = Rp 22.500**
- 💡 *Kenapa Pajak Siti Lebih Kecil?*: Karena Siti sudah menikah dan memiliki 1 anak, negara memberikan **Batas Bebas Pajak (PTKP) lebih besar (Rp 63 Juta)** dibanding Budi yang lajang (Rp 54 Juta). Sistem membaca status ini dari database profil karyawan dan menghitung bedanya secara otomatis tanpa campur tangan HRD.

---

### ❓ Bagaimana Jika Di Masa Depan Menambah Potongan Otomatis Baru?

**Prinsip Utama Mode Otomatis**:
- Mode **Otomatis** berarti potongan tersebut **membutuhkan rumus / logika pemrograman khusus di kode backend** yang membaca data aktivitas atau profil database tertentu.
- Jika kelak Anda ingin menambah fitur potongan otomatis baru (misal: *Potongan Keterlambatan Per Menit*), maka pengembang (programmer) akan:
  1. Menyiapkan rumus di backend: `Total Menit Telat dari Absensi x Rp 1.000`.
  2. HRD tinggal memilih Mode `Otomatis` di menu master, dan mesin akan mengecek menit telat masing-masing karyawan secara otomatis saat hitung payroll.

---

### 📊 Rekapitulasi Akhir Slip Gaji (Budi vs Siti):

| Komponen Penggajian | Karyawan A (Budi) | Karyawan B (Siti) | Keterangan Mode |
|---|---|---|---|
| **Gaji Pokok** | Rp 6.000.000 | Rp 6.000.000 | Pokok Jabatan |
| **Potongan BPJS Kesehatan** | - Rp 60.000 | - Rp 60.000 | **MANUAL** (Persentase 1% dari Master) |
| **Potongan Alpha (Bolos Kerja)** | **- Rp 0** | **- Rp 400.000** | **OTOMATIS** (Mesin baca 2 hari alpha di Absensi) |
| **Potongan Pajak PPh 21** | - Rp 112.500 | - Rp 67.500 | **OTOMATIS** (Mesin hitung PTKP TK/0 vs K/1) |
| **TOTAL DITRANSFER (TAKE HOME PAY)** | **Rp 5.827.500** | **Rp 5.472.500** | **Gaji Bersih Akhir** |

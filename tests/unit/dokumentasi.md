# DOKUMENTASI PENGUJIAN UNIT (UNIT TESTING)

---

## 1. File: `absensi.test.ts`
**Fungsi:** Menghitung Potongan Denda Karyawan yang Bolos / Absen Tanpa Keterangan (Alpha).

### **Alur & Rumus Hitungan:**
1. **Gaji per Hari**:  
   `Gaji per Hari = Gaji Pokok / 25 Hari Kerja`
2. **Total Denda Alpha**:  
   `Total Denda Alpha = Jumlah Hari Bolos x Gaji per Hari`
3. **Aturan Khusus**:  
   Karyawan yang Sakit (memiliki surat dokter) atau Cuti Resmi **tidak dipotong gaji** (Denda = Rp 0).

### **Pengujian yang Dilakukan (2 Tes):**
* **Tes 1 (Bolos 1 Hari, Gaji Rp 5 Juta)**:  
  * Gaji per Hari = `Rp 5.000.000 / 25 = Rp 200.000`  
  * **Hasil**: Total Denda = `1 x Rp 200.000 = Rp 200.000` (PASSED).
* **Tes 2 (Bolos 2 Hari, Gaji Rp 6 Juta)**:  
  * Gaji per Hari = `Rp 6.000.000 / 25 = Rp 240.000`  
  * **Hasil**: Total Denda = `2 x Rp 240.000 = Rp 480.000` (PASSED).

---

## 2. File: `jadwal-kerja.test.ts`
**Fungsi:** Menentukan Status Kehadiran Karyawan (`Hadir` atau `Telat`) Berdasarkan Jam Masuk dan Toleransi.

### **Alur & Rumus Hitungan:**
1. **Batas Toleransi Telat**:  
   `Batas Jam Masuk = Jam Masuk Standar (08:00) + Toleransi Telat (15 Menit) = 08:15 WIB`
2. **Aturan Status**:  
   * Jam Presensi $\le$ 08:15 WIB $\rightarrow$ **Status: Hadir**
   * Jam Presensi $>$ 08:15 WIB $\rightarrow$ **Status: Telat**

### **Pengujian yang Dilakukan (3 Tes):**
* **Tes 1 (Presensi Jam 08:00 WIB)**:  
  Tepat jam masuk $\rightarrow$ **Status: Hadir** (PASSED).
* **Tes 2 (Presensi Jam 08:14 WIB)**:  
  Masih di dalam batas toleransi 15 menit $\rightarrow$ **Status: Hadir** (PASSED).
* **Tes 3 (Presensi Jam 08:16 WIB)**:  
  Lewat 1 menit dari batas toleransi $\rightarrow$ **Status: Telat** (PASSED).

---

## 3. File: `lembur.test.ts`
**Fungsi:** Menghitung Uang Lembur Karyawan untuk Hari Kerja dan Hari Libur.

### **Alur & Rumus Hitungan:**
1. **Upah per Jam Dasar**:  
   `Upah per Jam = Gaji Pokok / 173 Jam`
2. **Uang Lembur Hari Kerja** (Pengali 1.5x):  
   `Uang Lembur = Total Jam Lembur x Upah per Jam x 1.5`
3. **Uang Lembur Hari Libur / Weekend** (Pengali 2.0x):  
   `Uang Lembur = Total Jam Lembur x Upah per Jam x 2.0`

### **Pengujian yang Dilakukan (3 Tes):**
* **Tes 1 (Upah per Jam - Gaji Rp 5.190.000)**:  
  * **Hasil**: `Upah per Jam = Rp 5.190.000 / 173 = Rp 30.000 per jam` (PASSED).
* **Tes 2 (Lembur 2 Jam di Hari Kerja)**:  
  * **Hasil**: `Uang Lembur = 2 Jam x Rp 30.000 x 1.5 = Rp 90.000` (PASSED).
* **Tes 3 (Lembur 4 Jam di Hari Libur)**:  
  * **Hasil**: `Uang Lembur = 4 Jam x Rp 30.000 x 2.0 = Rp 240.000` (PASSED).

---

## 4. File: `pengajuan-h2.test.ts`
**Fungsi:** Memvalidasi Batas Waktu Pengajuan Cuti & Lembur (Minimal H-2) vs Sakit Darurat (Boleh H-0).

### **Alur & Rumus Hitungan:**
1. **Hitung Selisih Hari**:  
   `Selisih Hari = Tanggal Pelaksanaan - Tanggal Diajukan`
2. **Syarat Cuti & Lembur**:  
   Harus `Selisih Hari >= 2 Hari` (Minimal H-2). Jika kurang $\rightarrow$ **Ditolak (terlalu mendadak)**.
3. **Syarat Sakit**:  
   Boleh `Selisih Hari = 0 Hari` (Diajukan di hari H karena darurat).

### **Pengujian yang Dilakukan (4 Tes):**
* **Tes 1 (Cuti Diajukan H-3)**:  
  Selisih 3 hari $\rightarrow$ **Disetujui (True)** (PASSED).
* **Tes 2 (Lembur Diajukan H-2)**:  
  Selisih 2 hari $\rightarrow$ **Disetujui (True)** (PASSED).
* **Tes 3 (Cuti Diajukan H-1)**:  
  Selisih 1 hari (mendadak) $\rightarrow$ **Ditolak (False)** (PASSED).
* **Tes 4 (Sakit Diajukan H-0)**:  
  Hari H Darurat $\rightarrow$ **Disetujui (True)** (PASSED).

---

## 5. File: `pph21.test.ts`
**Fungsi:** Menghitung Batas Bebas Pajak (PTKP) dan Potongan Pajak PPh 21 Bulanan.

### **Alur & Rumus Hitungan:**
1. **Biaya Jabatan**:  
   `Biaya Jabatan = 5% x Gaji Kotor Bulanan` (Maksimal Rp 500.000/bulan).
2. **Gaji Neto Tahunan**:  
   `Gaji Neto Tahunan = (Gaji Kotor Bulanan - Biaya Jabatan) x 12 Bulan`
3. **Batas Bebas Pajak (PTKP)**:  
   * Lajang tanpa anak (`TK/0`) = **Rp 54.000.000 / tahun**
   * Menikah + 1 anak (`K/1`) = `Rp 54 Juta + Rp 4.5 Juta + Rp 4.5 Juta = Rp 63.000.000 / tahun`
4. **Penghasilan Kena Pajak (PKP)**:  
   `PKP = Gaji Neto Tahunan - PTKP`
5. **Pajak PPh 21 Bulanan**:  
   `Pajak Bulanan = (5% x PKP) / 12 Bulan`

### **Pengujian yang Dilakukan (4 Tes):**
* **Tes 1 (PTKP Status TK/0)**:  
  * **Hasil**: PTKP tepat **Rp 54.000.000** (PASSED).
* **Tes 2 (PTKP Status K/1)**:  
  * **Hasil**: PTKP tepat **Rp 63.000.000** (PASSED).
* **Tes 3 (Gaji Rp 6 Juta, Status TK/0)**:  
  * Gaji Neto Tahunan = `(Rp 6 Juta - Rp 300rb) x 12 = Rp 68.400.000`  
  * PKP = `Rp 68.400.000 - Rp 54.000.000 = Rp 14.400.000`  
  * **Hasil**: Pajak Bulanan = `(5% x Rp 14.400.000) / 12 = Rp 60.000 per bulan` (PASSED).
* **Tes 4 (Gaji Rp 6 Juta, Status K/1)**:  
  * PKP = `Rp 68.400.000 - Rp 63.000.000 = Rp 5.400.000`  
  * **Hasil**: Pajak Bulanan = `(5% x Rp 5.400.000) / 12 = Rp 22.500 per bulan` (PASSED).

---

## 6. File: `saldo-cuti.test.ts`
**Fungsi:** Memeriksa Kecukupan Saldo Cuti Tahunan Karyawan (Kuota Awal: 12 Hari).

### **Alur & Rumus Hitungan:**
1. **Cek Kuota**:  
   Jika `Hari Cuti Diajukan <= Sisa Kuota Saat Ini` $\rightarrow$ **Disetujui**.
2. **Sisa Kuota Baru**:  
   `Sisa Kuota Baru = Sisa Kuota Saat Ini - Hari Cuti Diajukan`
3. **Jika Kuota Kurang**:  
   Jika `Hari Cuti Diajukan > Sisa Kuota Saat Ini` $\rightarrow$ **Ditolak** (Sisa kuota tidak berkurang).

### **Pengujian yang Dilakukan (3 Tes):**
* **Tes 1 (Sisa 12 Hari, Diajukan 3 Hari)**:  
  3 hari $\le$ 12 hari $\rightarrow$ **Disetujui (True)**, Sisa baru = `12 - 3 = 9 Hari` (PASSED).
* **Tes 2 (Sisa 2 Hari, Diajukan 5 Hari)**:  
  5 hari $>$ 2 hari $\rightarrow$ **Ditolak (False)**, Sisa tetap `2 Hari` (PASSED).
* **Tes 3 (Sisa 4 Hari, Diajukan 4 Hari)**:  
  4 hari $\le$ 4 hari $\rightarrow$ **Disetujui (True)**, Sisa baru = `4 - 4 = 0 Hari` (PASSED).

---

## 7. File: `validations.test.ts`
**Fungsi:** Menyaring Input Form Karyawan (Format NIK, Rekening BNI, dan Kontrak) Sebelum Disimpan.

### **Alur & Aturan Validasi:**
1. **NIK**: Harus tepat **16 digit angka**.
2. **Rekening BNI**: Harus tepat **10 digit angka**.
3. **Karyawan Kontrak**: Wajib mengisi durasi bulan kontrak.

### **Pengujian yang Dilakukan (4 Tes):**
* **Tes 1 (Data Lengkap & Benar)**:  
  NIK 16 digit & Rekening 10 digit $\rightarrow$ **Lolos (Success: True)** (PASSED).
* **Tes 2 (NIK 15 Digit)**:  
  Kurang 1 digit $\rightarrow$ **Ditolak (Success: False)** (PASSED).
* **Tes 3 (Rekening BNI 6 Digit)**:  
  Kurang 4 digit $\rightarrow$ **Ditolak (Success: False)** (PASSED).
* **Tes 4 (Status Kontrak Tanpa Durasi Bulan)**:  
  Durasi bulan kosong $\rightarrow$ **Ditolak (Success: False)** (PASSED).

# DOKUMEN PRESENTASI & LAPORAN ANALIS SISTEM: PERANCANGAN DAN IMPLEMENTASI SISTEM PENGGAJIAN BERBASIS WEB

**Studi Kasus:** Sistem Penggajian Berbasis Web (Payroll System)  
**Peran:** Sistem Analis & Software Engineer  
**Teknologi:** Next.js 16 (App Router, TypeScript), Prisma ORM v7, PostgreSQL, Tailwind CSS  
**Lokasi Project:** `C:\Users\ALFA\Documents\belajar coding\myproject\penggajian`  
**Status Implementasi & Validasi:** Final & Terverifikasi dengan Kode Sumber Aplikasi  

---

## 1. PENDAHULUAN & EXECUTIVE SUMMARY ANALIS SISTEM

Sebagai seorang Analis Sistem (System Analyst), perancangan dan implementasi aplikasi penggajian karyawan berbasis web ini didasarkan pada kebutuhan mendasar organisasi untuk mengotomatisasi perhitungan hak finansial karyawan, menjaga kepatuhan terhadap aturan ketenagakerjaan dan perpajakan nasional (PPh 21 TER / Progresif), serta menjamin akuntabilitas, keamanan, dan auditabilitas data keuangan perusahaan.

### 1.1 Hasil Validasi Dokumentasi vs Realita Kode Aplikasi
Telah dilakukan validasi komprehensif antara spesifikasi dokumen [alur-sistem-penggajian.md](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/dokumentasi/alur-sistem-penggajian.md) dan [Dokumentasi-Rumus-dan-Kalkulasi-Penggajian.md](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/dokumentasi/Dokumentasi-Rumus-dan-Kalkulasi-Penggajian.md) terhadap berkas kode sumber (*source code*) pada direktori [app/](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/app) dan [lib/](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib).

**Temuan Utama Validasi:**
1. **Skema Basis Data (LRS 15 Tabel)**: Seluruh 15 tabel PostgreSQL yang dirancang pada LRS dokumen alur telah terpasang dan sinkron sempurna pada [schema.prisma](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/prisma/schema.prisma), meliputi entitas: `account`, `employee`, `jabatan`, `jadwal_kerja`, `hari_libur`, `absensi`, `pengajuan`, `saldo_cuti`, `jenis_potongan`, `tarif_lembur`, `tunjangan_lain`, `periode_penggajian`, `slip_gaji`, `slip_gaji_detail`, dan `log_aktivitas`.
2. **Pemisahan Role & Hak Akses (RBAC)**: Terdapat 3 role utama (`Karyawan`, `HRD`, `Admin/Owner`) yang diisolasi secara aman menggunakan [middleware.ts](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/middleware.ts) berbasis JSON Web Token (JWT via library `jose`).
3. **Pola Maker-Checker (Four-Eyes Principle)**: HRD bertindak sebagai *Maker* yang mengelola data karyawan, jabatan, potongan, dan approval pengajuan. Admin/Owner bertindak sebagai *Checker / Auditor* melalui monitoring [log_aktivitas](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/log-aktivitas.ts) serta eksekusi penguncian payroll (*Payroll Locking*).
4. **Arsitektur 3-Tier Monorepo Modern**: Kode terpisah rapi menjadi UI Presentation Layer (`app/(dashboard)/`), Endpoint Controller / API Layer ([app/api/](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/app/api)), dan Engine Calculation / Domain Service Layer ([lib/services/](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services)).

---

## 2. ANALISIS SKALABILITAS PERANGKAT LUNAK (SOFTWARE SCALABILITY ANALYSIS)

Analisis skalabilitas dilakukan untuk memastikan perangkat lunak mampu menangani lonjakan beban kerja, pertambahan jumlah karyawan, serta volume transaksi presensi dan kalkulasi payroll seiring pertumbuhan perusahaan.

```
                    ┌─────────────────────────────────────────┐
                    │          Client Layer (Browser)         │
                    └────────────────────┬────────────────────┘
                                         │ HTTPS / REST API
                    ┌────────────────────▼────────────────────┐
                    │      Stateless Next.js Edge Server      │
                    │   (App Router + Middleware JWT Auth)   │
                    └────────────────────┬────────────────────┘
                                         │ Direct Function Call
                    ┌────────────────────▼────────────────────┐
                    │   Engine Service Layer (lib/services/)  │
                    │ (payroll, pph21, lembur, absensi, pdf)  │
                    └────────────────────┬────────────────────┘
                                         │ PostgreSQL Protocol (@prisma/adapter-pg)
                    ┌────────────────────▼────────────────────┐
                    │   PostgreSQL Database (15 Tabel LRS)    │
                    │  Indexed [employee_id, tanggal, etc]    │
                    └─────────────────────────────────────────┘
```

### 2.1 Skalabilitas Vertikal vs Horisontal (Stateless Server Architecture)
* **Horisontal Scaling**: Next.js App Router API Routes dirancang bersifat *stateless*. Autentikasi menggunakan JWT Token yang disimpan pada HTTP-Only Cookie (`session`), sehingga server tidak menyimpan state sesi di memory. Hal ini memungkinkan backend dipasang di balik Load Balancer (misal: Vercel Serverless Functions, AWS ECS container cluster, atau Nginx multi-instance) dan berskala secara horisontal tanpa masalah kehilangan sesi pengguna.
* **Vertikal Scaling**: Untuk pemrosesan batch payroll pada perusahaan dengan puluhan ribu karyawan, server dapat menskala RAM dan CPU cores untuk mempercepat eksekusi loop kalkulasi di [payroll-service.ts](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/payroll-service.ts).

### 2.2 Skalabilitas Mesin Penggajian (Payroll Engine Batch Processing)
Pada fungsi [processPayrollPeriode](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/payroll-service.ts#L17-L159), terjadi pemrosesan batch untuk seluruh karyawan aktif:
* **Analisis Bottleneck (N+1 Query Problem)**: Saat ini, kalkulasi iterating per karyawan melakukan query Prisma terpisah ke `pengajuan`, `absensi`, `tunjangan_lain`, dan `jenis_potongan`.
* **Strategi Optimasi Scale-Up**: Untuk kapasitas skala besar (> 10.000 karyawan), analisis sistem merekomendasikan strategi **Bulk Data Pre-Fetching**, **Batch In-Memory Mapping**, dan **Asynchronous Job Worker** (BullMQ + Redis).

### 2.3 Database Connection Pooling & Caching Strategy
* **Connection Pooling**: Akses basis data menggunakan `@prisma/adapter-pg` dan driver `pg` yang memanfaatkan Connection Pool PostgreSQL untuk mencegah *connection starvation*.
* **Caching Data Master**: Data master yang jarang berubah (`jabatan`, `jenis_potongan`, `tarif_lembur`, `hari_libur`) disimpan pada in-memory cache untuk meminimalkan beban query database.

### 2.4 Asynchronous Background Jobs & Cron Jobs
Proses yang sifatnya harian tidak dibebankan pada request user, melainkan melalui endpoint cron dedicated:
* `app/api/cron/generate-alpha`: Menetapkan status Alpha secara otomatis untuk karyawan yang tidak absen hingga akhir hari.
* `app/api/cron/nonaktif-kontrak`: Menonaktifkan akun karyawan yang masa jabatannya berakhir.
* `app/api/cron/saldo-cuti`: Menginisialisasi ulang kuota cuti tahunan (12 hari).

---

## 3. PENGGUNAAN SQL & AKSES BASIS DATA (SQL USAGE & DATABASE ACCESS)

### 3.1 Skema Basis Data & Integritas Relasional
Skema dirancang menggunakan 15 tabel LRS dengan aturan integritas data yang ketat:
* **Strong Data Typing & Enums**: `status_absensi`, `jenis_pengajuan`, `status_pengajuan`, `role_account`, dll.
* **Constraint Kombinasi Unik (Composite Unique Constraints)**:
  * `absensi`: `@@unique([employee_id, tanggal])`
  * `periode_penggajian`: `@@unique([bulan, tahun])`
  * `slip_gaji`: `@@unique([periode_penggajian_id, employee_id])`
  * `saldo_cuti`: `@@unique([employee_id, tahun])`

### 3.2 Akses Data via Prisma ORM v7 & Database Transactions
Aplikasi menggunakan **Prisma ORM v7** dengan `@prisma/adapter-pg`. Transaksi atomik (`$transaction`) dipasang pada eksekusi penguncian payroll dan mutasi absensi sensitif untuk menjaga standar integritas ACID.

### 3.3 Indeks Basis Data (Indexing Strategy)
1. **Primary Key Indexes**: Otomatis dipasang pada seluruh kolom `id` (B-Tree Index).
2. **Unique Indexes**: `employee.nik`, `employee.username`, `account.username`, `hari_libur.tanggal`.
3. **Foreign Key Indexes**: Indeks dipasang pada `absensi(employee_id)`, `pengajuan(employee_id)`, `slip_gaji(employee_id)` untuk mempercepat agregasi query rekapitulasi.

---

## 4. IMPLEMENTASI ALGORITMA PEMROGRAMAN (PROGRAMMING ALGORITHM IMPLEMENTATION)

### 4.1 Algoritma Core Orchestration Engine (`lib/services/payroll-service.ts`)
$$\text{Gaji Bersih} = \max\left(0, \text{Total Pendapatan} - \text{Total Potongan}\right)$$

### 4.2 Algoritma Perhitungan Pajak PPh 21 TER / Progresif (`lib/services/pph21-service.ts`)
1. **Biaya Jabatan**: $5\% \times \text{Gaji Bruto Bulanan}$ (maksimal $\text{Rp } 500.000$/bulan).
2. **PTKP**: $\text{Rp } 54.000.000 + (\text{Menikah} ? 4.500.000 : 0) + (\min(\text{Tanggungan}, 3) \times 4.500.000)$.
3. **PKP**: $\max(0, \text{Neto Tahunan} - \text{PTKP})$.
4. **Tarif Progresif Tahunan**: Lapisan 1 ($5\%$), Lapisan 2 ($15\%$), Lapisan 3 ($25\%$), Lapisan 4 ($30\%$).

### 4.3 Algoritma Upah Lembur Multiplier (`lib/services/lembur-service.ts`)
* Upah per jam dasar $= \text{Gaji Pokok} / 173$. Multiplier $1.5\times$ (hari kerja) dan $2.0\times$ (hari libur/akhir pekan).

### 4.4 Algoritma Potongan Alpha & Absensi (`lib/services/absensi-service.ts`)
* Potongan Alpha $= \text{Total Hari Alpha} \times (\text{Gaji Pokok} / 25)$. Sakit dengan surat dokter dan Cuti yang disetujui **tidak memotong gaji pokok**.

### 4.5 Algoritma Aturan Bisnis Otomatis
* **Validasi H-2 Pengajuan**: Pengajuan Cuti dan Lembur wajib minimal H-2 (kecuali Sakit).
* **Auto-Reject Pengajuan Kadaluarsa**: Auto-update status `menunggu` yang kadaluarsa menjadi `ditolak` dengan alasan otomatis.

---

## 5. PEMBUATAN DOKUMEN KODE PROGRAM (CODE DOCUMENTATION & ARCHITECTURE STANDARDS)

### 5.1 Standar JSDoc & Format Response API
Seluruh fungsi service diberi header JSDoc berbahasa Indonesia. Seluruh API Route Handler mengembalikan format JSON seragam via [lib/api-response.ts](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/api-response.ts) (`successResponse`, `errorResponse`, `unauthorizedResponse`, `forbiddenResponse`).

### 5.2 Validasi Input Zod Schemas & Audit Log
Input request divalidasi ketat menggunakan Zod Schemas di folder `lib/validations/`. Setiap mutasi data penting dicatat ke tabel `log_aktivitas` dengan payload JSONB `nilai_lama` dan `nilai_baru`.

---

## 6. DEBUGGING & PROFILING PROGRAM (DEBUGGING & PROFILING STRATEGIES)

### 6.1 Debugging & Timezone Consistency
Semua API Route menggunakan blok `try-catch` dengan logging `console.error()`. Penanganan tanggal dibakukan ke WIB (UTC+7) menggunakan `Date.UTC(year, month, date)` untuk mencegah pergeseran tanggal absensi saat pergantian hari.

### 6.2 Profiling Server & Akses Database
Query latensi dipantau melalui Prisma Query Event Logging (`prisma.$on('query')`). Stream buffer PDFKit diprofiling untuk mencegah *Heap Memory Leak*.

---

## 7. CODE REVIEW & SECURITY AUDIT

1. **Pencegahan IDOR (Insecure Direct Object Reference)**: Pengecekan otorisasi `session.id` pada API endpoint.
2. **Kriptografi Password & Sesi**: Hashing `bcryptjs` (salt cost 10) dan JWT HTTP-Only Cookies.
3. **Maker-Checker Pattern**: HRD sebagai *Maker* dan Admin/Owner sebagai *Checker/Auditor* melalui Log Aktivitas & Payroll Locking.

---

## 8. PENGUJIAN UNIT PROGRAM DAN INTEGRASI PROGRAM (UNIT & INTEGRATION TESTING)

### 8.1 Arsitektur & Status Pengujian Otomatis (Vitest)
Pengujian otomatis dikonfigurasi menggunakan **Vitest** ([vitest.config.mts](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/vitest.config.mts)). 

#### **Hasil Running Test Suite Saat Ini (Status: 100% PASS)**:
```bash
 RUN  v4.1.10 C:/Users/ALFA/Documents/belajar coding/myproject/penggajian

 ✓ tests/unit/absensi.test.ts (2 tests)
 ✓ tests/unit/lembur.test.ts (3 tests)
 ✓ tests/unit/pph21.test.ts (4 tests)

 Test Files  3 passed (3)
      Tests  9 passed (9)
   Duration  352ms
```

---

### 8.2 Rencana Perluasan Cakupan Pengujian (Vitest Test Coverage Expansion)

Selain 3 file pengujian unit kalkulasi yang sudah berjalan di atas, Vitest disiapkan untuk memperluas cakupan pengujian ke modul operasional lainnya **tanpa merusak kode aplikasi yang ada**:

```
tests/
├── unit/
│   ├── pph21.test.ts              → [PASSED] Unit test rumus PTKP & PPh 21 TER/Progresif
│   ├── lembur.test.ts             → [PASSED] Unit test upah 1/173 & multiplier hari libur
│   ├── absensi.test.ts            → [PASSED] Unit test denda alpha 1/25 gaji pokok
│   ├── pengajuan-h2.test.ts       → [RENCANA] Unit test validasi H-2 Cuti & Lembur vs H-0 Sakit
│   ├── saldo-cuti.test.ts         → [RENCANA] Unit test logika pemotongan kuota cuti tahunan (12 hari)
│   └── jadwal-kerja.test.ts       → [RENCANA] Unit test toleransi keterlambatan presensi (misal 15 menit)
└── validations/
    ├── employee-schema.test.ts    → [RENCANA] Validasi Zod NIK 16 digit & Rekening BNI 10 digit
    └── pengajuan-schema.test.ts   → [RENCANA] Validasi Zod jam lembur & bukti surat dokter
```

#### **Rincian Skenario Modul Pengujian Tambahan:**

1. **Modul Pengajuan (Cuti, Sakit, & Lembur)**:
   * **Pengujian Validasi H-2**: Memastikan sistem menolak submit pengajuan Cuti/Lembur jika `selisih_hari < 2` hari, dan menerima jika $\ge 2$ hari.
   * **Pengujian Pengecualian Sakit**: Memastikan pengajuan Sakit dapat diajukan di hari H (H-0) tanpa terkena aturan H-2.
   * **Pengujian Kuota Cuti**: Memastikan sistem menolak pengajuan jika jumlah hari yang diajukan melebihi sisa kuota di tabel `saldo_cuti`.

2. **Modul Jam Kerja & Presensi (`jadwal_kerja` & `absensi`)**:
   * **Pengujian Toleransi Keterlambatan**: Menguji logika jika jam masuk = `08:00` dan toleransi = `15 menit`, presensi pukul `08:14` menghasilkan status `hadir`, sedangkan pukul `08:16` menghasilkan status `telat`.
   * **Pengujian Koreksi Presensi HRD**: Memastikan perubahan status dari `hadir` ke `alpha` oleh HRD mencatat flag `dikoreksi_hrd = true` dan mengisikan `catatan_alasan`.

3. **Modul Validasi Zod Schemas (`lib/validations/`)**:
   * **Pengujian NIK & Rekening BNI**: Memastikan Zod menolak NIK yang kurang dari 16 digit atau nomor rekening BNI yang tidak sama dengan 10 digit angka.
   * **Pengujian Durasi Kontrak**: Memastikan Zod mewajibkan `durasi_kontrak_bulan` diisi jika `status_kepegawaian === 'kontrak'`.

4. **Modul Orchestration Payroll Engine & Locking**:
   * **Pengujian Take Home Pay Agregat**: Memastikan gabungan Gaji Pokok + Tunjangan + Lembur - BPJS - PPh 21 - Alpha menghasilkan angka gaji bersih yang tepat.
   * **Pengujian Payroll Locking Guard**: Memastikan periode penggajian yang berstatus `'terkunci'` menolak modifikasi slip gaji.

---

## 9. RINGKASAN MATRIKS KEPATUHAN SISTEM

| Aspek Analisis | Target Spesifikasi | Hasil Validasi Kode & Realita | Status |
|---|---|---|---|
| **Skalabilitas** | Stateless Next.js API Routes + Pool DB | JWT Session Auth + PostgreSQL `@prisma/adapter-pg` | ✅ Met |
| **SQL & Database** | LRS 15 Tabel PostgreSQL + Transactions | Full 15 Models Prisma + Composite Unique Constraints + `$transaction` | ✅ Met |
| **Algoritma Payroll** | THP, PPh 21 Progresif, Lembur 1/173, Alpha | `payroll-service`, `pph21-service`, `lembur-service`, `absensi-service` | ✅ Met |
| **Dokumentasi Kode** | JSDoc, API Response Standard, Audit Log | Response Standard di `lib/api-response.ts` & Log JSONB `log_aktivitas` | ✅ Met |
| **Debugging & Log** | Handled Exceptions & Timezone Consistency | WIB Standard (`Date.UTC`), Try-Catch Routing, Audit Trail | ✅ Met |
| **Code Review & Security** | IDOR Guard, Bcrypt Hash, Maker-Checker | JWT Middleware, Bcrypt Salting, HRD Maker vs Admin Checker | ✅ Met |
| **Testing** | Unit & Integration Test Architecture | Configured Vitest + 9 Tests Passed + Expansion Plan | ✅ Met |

---

## 10. KESIMPULAN & REKOMENDASI DEVELOPMENT SYSTEM ANALYST

Sistem penggajian karyawan berbasis web ini dinyatakan **layak (*production-ready*)**, aman, akuntabel, dan memenuhi seluruh standar perancangan perangkat lunak modern.

**Rekomendasi Skala Enterprise:**
1. **Background Job Queue**: Menerapkan Redis + BullMQ untuk kalkulasi batch penggajian di atas 10.000 karyawan.
2. **Database Read-Replicas**: Memisahkan traffic query laporan payroll dari traffic presensi harian.
3. **Automated CI/CD Pipeline**: Mengintegrasikan Vitest test suite ke dalam GitHub Actions pipeline.

---

## 11. JAWABAN PERTANYAAN ASESMEN UJI KOMPETENSI ANALIS SISTEM

### Pertanyaan 1: Menggunakan SQL (E.6 / KUK 6.2, E.7 / KUK 7.1)
**Soal:** Bagaimana Anda menuliskan query SQL untuk menampilkan data penggajian berdasarkan bulan yang dipilih nilai rata-ratanya?

```sql
SELECT 
    p.bulan, p.tahun,
    COUNT(sg.id) AS total_karyawan_diproses,
    ROUND(AVG(sg.gaji_pokok), 2) AS rata_rata_gaji_pokok,
    ROUND(AVG(sg.tunjangan_jabatan), 2) AS rata_rata_tunjangan_jabatan,
    ROUND(AVG(sg.total_lembur), 2) AS rata_rata_upah_lembur,
    ROUND(AVG(sg.total_potongan), 2) AS rata_rata_total_potongan,
    ROUND(AVG(sg.gaji_bersih), 2) AS rata_rata_gaji_bersih_thp
FROM slip_gaji sg
JOIN periode_penggajian p ON sg.periode_penggajian_id = p.id
WHERE p.bulan = 8 AND p.tahun = 2026
GROUP BY p.id, p.bulan, p.tahun;
```

Eksekusi via Prisma ORM v7:
```typescript
const rataRataPayroll = await prisma.slip_gaji.aggregate({
  where: { periode_penggajian: { bulan: targetBulan, tahun: targetTahun } },
  _avg: { gaji_pokok: true, tunjangan_jabatan: true, total_lembur: true, total_potongan: true, gaji_bersih: true },
  _count: { id: true }
})
```

---

### Pertanyaan 2: Menerapkan Akses Basis Data (E.2 / KUK 2.2, E.3 / KUK 3.1)
**Soal:** Bagaimana Anda menghubungkan program dengan basis data penggajian dan memastikan data dapat diakses dengan benar?

1. **Koneksi & Adapter**: PostgreSQL terhubung via `DATABASE_URL` menggunakan **Prisma Client v7** dan `@prisma/adapter-pg` ([lib/prisma.ts](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/prisma.ts)) bertipe *Singleton Pattern*.
2. **Type-Safety**: Skema PostgreSQL ditarik via `npx prisma db pull` ke [schema.prisma](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/prisma/schema.prisma) untuk menghasilkan TypeScript Type Definitions.
3. **Validitas & Keamanan**: Memasang *Composite Unique Keys*, otorisasi JWT Middleware, pengecekan IDOR, dan transaksi atomik (`$transaction`).

---

### Pertanyaan 3: Mengimplementasikan Algoritma Pemrograman (E.5 / KUK 5.2)
**Soal:** Bagaimana Anda mengimplementasikan algoritma untuk menghitung total gaji dalam program yang Anda buat?

Algoritma diisolasi pada [lib/services/payroll-service.ts](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/lib/services/payroll-service.ts):

$$\text{Gaji Bersih} = \max\left(0, \text{Total Pendapatan} - \text{Total Potongan}\right)$$

1. **Pendapatan**: Gaji Pokok + Tunjangan Jabatan + Uang Makan + Upah Lembur ($1/173 \times \text{Gaji Pokok} \times \text{Multiplier}$) + Tunjangan Lain.
2. **Potongan**: BPJS (1% Kes, 2% JHT, 1% JP) + Potongan Alpha ($\text{Hari Alpha} \times \text{Gaji Pokok} / 25$) + PPh 21 (Biaya Jabatan 5%, PTKP, & Tarif Progresif 5%-30%).
3. **Snapshot**: Disimpan ke `slip_gaji` dan rincian ke `slip_gaji_detail`.

---

### Pertanyaan 4: Membuat Dokumen Kode Program (E.4 / KUK 4.2)
**Soal:** Bagaimana Anda menyusun dokumen kode program agar dapat dipahami dengan mudah?

1. **JSDoc Comment**: Penulisan header JSDoc pada setiap fungsi service (`@param`, `@returns`).
2. **Arsitektur Modular**: Pemisahan `app/api/` (Controllers), `lib/services/` (Engines), `lib/validations/` (Zod Schemas), dan `lib/api-response.ts`.
3. **Standard Naming**: `camelCase` (TypeScript), `snake_case` (PostgreSQL), `PascalCase` (React Components/Types).
4. **Dokumentasi Arsitektur**: Menyediakan berkas markdown [alur-sistem-penggajian.md](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/dokumentasi/alur-sistem-penggajian.md), [Dokumentasi-Rumus-dan-Kalkulasi-Penggajian.md](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/dokumentasi/Dokumentasi-Rumus-dan-Kalkulasi-Penggajian.md), dan [implementasi.md](file:///c:/Users/ALFA/Documents/belajar%20coding/myproject/penggajian/implementasi.md).

---

### Pertanyaan 5: Melakukan Debugging
**Soal:** Bagaimana Anda menemukan dan memperbaiki kesalahan (bug) yang muncul saat program dijalankan?

1. **Pencatatan & Logging**: Blok `try-catch` dengan `console.error()` dan Prisma Query Logging (`prisma.$on('query')`).
2. **Isolasi Masalah via Vitest**: Menjalankan *unit testing* terisolasi pada folder `tests/` untuk menguji fungsi kalkulasi tanpa memicu database runtime.
3. **Perbaikan & Verifikasi (Contoh Bug)**: Mengatasi pergeseran tanggal absensi akibat timezone server vs WIB (UTC+7) menggunakan `Date.UTC(year, month, date)`.

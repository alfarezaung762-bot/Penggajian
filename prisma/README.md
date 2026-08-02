# 📜 Panduan Reset & Seeding Database Penggajian

Dokumen ini menjelaskan alur, fungsi, dan langkah-langkah menjalankan pengisian data awal (*seeding*) atau reset database pada sistem penggajian.

---

## 🎯 1. Apa itu `prisma/seed.ts`?

File `prisma/seed.ts` adalah skrip otomatisasi yang bertugas melakukan **Clean Reset & Seeding** data awal ke database PostgreSQL (Neon Cloud / Localhost).

Saat dijalankan, skrip ini secara otomatis:
1. 🧹 **Membersihkan Database**: Menghapus seluruh isi tabel lama (urutan penanganan *foreign key* aman tanpa *constraint violation*).
2. 💼 **Master Jabatan**: Membuat 6 master jabatan (Direktur, Manager HRD, Sr. Software Engineer, Staff Sales, Staff Akuntansi, Staff Logistik).
3. 🔐 **Akun Pengelola (Staff)**: Membuat akun **HRD** (`hrd`) dan **Admin Owner** (`admin`).
4. 👥 **Data 31 Karyawan**: Membuat akun **Karyawan Demo `budi`** dan **30 Karyawan Baru** lengkap dengan foto avatar profil manusia asli dari RandomUser API.
5. 📅 **Master Kalender & Potongan**: Mengisi 4 Hari Libur Nasional 2026, Master Tunjangan Lain, dan Master Jenis Potongan (BPJS, PPh 21 HPP, Denda Alpha).
6. ⏰ **Absensi & Pengajuan Multi-Bulan**: Menghasilkan ribuan record absensi harian, permohonan cuti, sakit, dan lembur untuk periode Juni s/d Agustus 2026.
7. 💵 **Slip Gaji & Audit Log**: Menghitung otomatis slip gaji periode Juni (terkunci) dan Juli (terkunci), serta merekam histori audit log aktivitas.

---

## ⚠️ 2. Checklist Sebelum Menjalankan Seeding

Sebelum mengeksekusi skrip, pastikan Anda memeriksa hal-hal berikut:

* [ ] **Periksa Target Database (`.env`)**:
  Pastikan variabel `DATABASE_URL` di file `.env` mengarah ke database yang ingin Anda isi:
  * Untuk **Neon Cloud (Vercel Production)**:
    `DATABASE_URL="postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require"`
  * Untuk **Komputer Lokal (pgAdmin)**:
    `DATABASE_URL="postgresql://postgres:12345@localhost:5432/Penggajian?schema=public"`

* [ ] **Peringatan Reset Data (Destruktif)**:
  Skrip ini akan **MENGHAPUS SELURUH DATA LAMA** di database target untuk digantikan dengan data baru. Pastikan tidak ada data produksi nyata yang tidak disengaja terhapus.

---

## 🚀 3. Perintah Cara Menjalankan

Buka terminal di folder utama proyek (VS Code Terminal: `Ctrl + ~`), lalu jalankan perintah berikut:

### Option A: Sinkronkan Tabel + Jalankan Seeding (Rekomendasi Utama)
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### Option B: Reset Total Skema Database + Seeding dari Nol
```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

---

## 🔑 4. Daftar Kredensial Akun Hasil Seeding

Setelah seeding selesai, Anda dapat langsung login menggunakan akun-akun demo berikut:

| Role | Tab Login | Username | Password | Deskripsi |
|---|---|---|---|---|
| **Karyawan Demo** | Login Karyawan | `budi` | `budi123` | Akun Demo Utama Karyawan |
| **Staf HRD** | Login HRD / Admin | `hrd` | `hrd123` | Akses Kelola Karyawan, Cuti, & Lembur |
| **Admin / Owner** | Login HRD / Admin | `admin` | `admin123` | Akses Penuh Sistem & Penguncian Gaji |
| **30 Karyawan Lain** | Login Karyawan | `budi_santoso`<br>`siti_aminah`<br>`dewi_lestari`<br>*(dll)* | `password123` | Akun Karyawan Dummy Tambahan |

---

*Dokumen ini dibuat secara otomatis untuk memastikan pemeliharaan dan pengujian database berjalan aman.*

# Dokumen Alur Sistem — Aplikasi Penggajian Berbasis Web

**Studi kasus:** Perancangan dan implementasi aplikasi penggajian berbasis web dengan analisis skalabilitas, penggunaan SQL, akses basis data, implementasi algoritma, dokumentasi kode, debugging, profiling, code review, unit testing, dan integration testing.

**Status dokumen:** Final — v2.0 (siap dijadikan acuan implementasi)

> ## ⚠️ Catatan Penting untuk Antigravity — Baca Dulu Sebelum Menulis Kode
>
> 1. **Database PostgreSQL SUDAH DIBUAT dan berjalan** — bukan rencana, bukan asumsi. Nama database `Penggajian`, berisi **15 tabel lengkap** (PK, FK, `ENUM` type, `CHECK`, `UNIQUE` constraint) sesuai **Bagian 7**. Jangan membuat migration baru atau `CREATE TABLE` dari nol.
> 2. **`schema.prisma` SUDAH di-generate** dari database yang ada lewat `npx prisma db pull` + `npx prisma generate` (lihat Bagian 8.4). Jangan menulis ulang `schema.prisma` secara manual — jika struktur tabel perlu berubah, ubah dulu di PostgreSQL, baru jalankan `db pull` lagi.
> 3. **Project Next.js belum di-scaffold** di titik dokumen ini terakhir diperbarui — folder `app/`, `lib/`, dan seluruh kode aplikasi (backend maupun frontend) **belum ditulis sama sekali**. Seluruh isi Bagian 8 adalah spesifikasi/rencana yang siap diimplementasikan, bukan laporan progres kode yang sudah ada.
> 4. Ikuti struktur folder backend (**Bagian 8.6–8.7**) dan frontend (**Bagian 8.10**) apa adanya — ini sudah melalui beberapa iterasi diskusi dan revisi, bukan draf awal.
> 5. Database di Bagian 7 adalah ***source of truth*** — jika ada perbedaan antara dokumen ini dan struktur database aktual, database yang benar (lihat Bagian 8.2).

---

## 1. Ringkasan Sistem

Sistem penggajian berbasis web dengan 3 role pengguna: **Admin/Owner**, **HRD**, dan **Karyawan**. Setiap role memiliki hak akses dan tampilan berbeda sesuai fungsinya. Sistem mencakup presensi, pengajuan cuti/sakit/lembur, perhitungan gaji otomatis (termasuk potongan dan tunjangan), serta pelaporan.

---

## 2. Role & Hak Akses

### 2.1 Role: Karyawan (User biasa)

Fokus utama: mencatat kehadiran dan menerima hak (gaji, cuti).

| Menu | Deskripsi |
|---|---|
| **Absensi** | Presensi masuk & pulang harian dengan foto wajah sebagai bukti. Status kehadiran (tepat waktu / telat / alpha) ditentukan otomatis oleh sistem berdasarkan jam kerja yang diatur HRD. |
| **Pengajuan** | Satu menu terpadu. Karyawan memilih jenis pengajuan dari dropdown/pilihan (`Cuti` / `Sakit` / `Lembur`), lalu form konten berubah otomatis mengikuti jenis yang dipilih (lihat Bagian 2.1.1). Semua jenis pengajuan berbagi status yang sama: `Menunggu → Disetujui/Ditolak`, dan tercatat dalam satu histori riwayat pengajuan. |
| **Slip Gaji** | Melihat histori & mengunduh (PDF) slip gaji bulanan milik sendiri. Hanya menampilkan bulan yang sudah difinalisasi (locked) oleh HRD/Admin. |

#### 2.1.1 Detail Menu Pengajuan (Form Dinamis)

Alur: Karyawan membuka menu **Pengajuan** → pilih **Jenis Pengajuan** (Cuti / Sakit / Lembur) → form field yang tampil menyesuaikan pilihan tersebut.

| Jenis Dipilih | Field yang Tampil | Ketentuan Khusus |
|---|---|---|
| **Cuti** | Tanggal mulai, Tanggal selesai, Alasan | Sisa kuota cuti tahun berjalan ditampilkan otomatis di atas form. Sistem menolak submit jika jumlah hari yang diajukan melebihi sisa kuota. |
| **Sakit** | Tanggal, Upload foto surat keterangan dokter | Wajib upload foto sebagai bukti. Tidak memotong gaji jika disetujui. |
| **Lembur** | Tanggal, Jam mulai, Jam selesai, Upload foto bukti | Total jam lembur dihitung otomatis dari selisih jam mulai–selesai. |

**Komponen yang sama untuk ketiga jenis:**
- Status pengajuan: `Menunggu → Disetujui / Ditolak` (dengan catatan alasan bila ditolak oleh HRD)
- Riwayat pengajuan: satu tabel/list gabungan menampilkan seluruh histori pengajuan (apa pun jenisnya), dengan filter jenis dan status.

**Catatan implementasi (untuk tahap desain database/UI):**
- Bisa dirancang sebagai satu tabel `pengajuan` dengan kolom `jenis` (enum: cuti/sakit/lembur) dan kolom-kolom lain bersifat *nullable* karena tidak semua jenis memakai field yang sama (misal `jam_mulai_lembur`/`jam_selesai_lembur` hanya diisi untuk lembur).
- Di sisi tampilan (frontend), cukup satu komponen form dengan *conditional rendering* berdasarkan `jenis` yang dipilih — tidak perlu 3 halaman terpisah.

### 2.2 Role: HRD

| Menu | Deskripsi |
|---|---|
| **Data Karyawan** | CRUD data karyawan: NIK, Nama, Username, Password, Jenis Kelamin, Jabatan, Tanggal Masuk, Status Pernikahan & Jumlah Tanggungan (untuk PPh 21), No. Rekening Bank, Status Kepegawaian (Tetap / Kontrak dengan durasi otomatis nonaktif saat jatuh tempo), Foto 1x1. Termasuk tombol reset password & nonaktifkan akun. |
| **Data Jabatan** | Dapat melihat **dan mengubah** (Nama Jabatan, Gaji Pokok, Tunjangan Jabatan, Uang Makan) — per keputusan pembagian beban kerja (lihat catatan Bagian 3, poin 8), akses ubah/tambah/hapus dipegang HRD, bukan lagi Admin/Owner. |
| **Potongan Gaji** | Dapat melihat **dan mengubah** jenis potongan (BPJS, PPh21, dsb) — dengan pola akses yang sama seperti Data Jabatan. Lihat detail kategori di Bagian 2.3.1. |
| **Pengaturan Jadwal** (sidebar bercabang) | Menu induk dengan 2 sub-menu: |
| &nbsp;&nbsp;↳ *Jam Kerja / Shift* | Atur jam masuk & pulang per hari (Senin–Minggu). Hari yang tidak diisi otomatis dianggap libur mingguan. |
| &nbsp;&nbsp;↳ *Kalender Libur Nasional* | Input tanggal libur nasional/cuti bersama (Lebaran, Natal, dll). Mencegah karyawan tercatat alpha di tanggal tsb, dan menjadi acuan tarif lembur hari libur. |
| **Approval Pengajuan** | Menyetujui/menolak pengajuan cuti, sakit, dan lembur dari karyawan, dengan catatan alasan bila ditolak. Untuk pengajuan **Cuti** dan **Lembur**, sistem mewajibkan pengajuan dilakukan minimal **H-2** (2 hari sebelum tanggal yang diajukan) — form otomatis menolak submit jika kurang dari batas tsb. Aturan ini **tidak berlaku untuk Sakit**, karena sifatnya darurat/tidak terduga sehingga bisa diajukan kapan saja (termasuk di hari yang sama). |
| **Rekap Absensi** | Ringkasan per karyawan: hadir, sakit, alpha, lembur (jam). Filter per bulan. Klik nama karyawan → detail per tanggal beserta foto bukti absensi. HRD dapat **mengoreksi status absensi per tanggal** (misal status awal "Hadir" ternyata setelah ditelusuri foto bukti tidak valid/rekayasa AI, maka HRD mengubahnya jadi "Alpha"). Setiap koreksi wajib menyertakan alasan, dan otomatis tercatat ke **Audit Log** (nilai lama → nilai baru, siapa yang mengubah, kapan) sehingga bisa ditelusuri Admin/Owner. Bisa dicetak per bulan/tahun. |
| **Laporan Gaji** | Melihat & mencetak laporan gaji seluruh karyawan, filter per bulan/tahun. Read-only (tidak bisa ubah nominal). |

**Catatan struktur sidebar — Pengaturan Jadwal:**
Kedua menu ini digabung di bawah satu induk karena sama-sama mengatur "kapan karyawan dianggap bekerja/libur" — satu untuk pola mingguan (jam kerja), satu untuk pengecualian tanggal tertentu (libur nasional). Di sidebar, ini tampil sebagai item induk yang bisa di-*expand* menjadi 2 sub-item (mirip folder), bukan 2 menu terpisah sejajar. Ini juga memudahkan penambahan sub-menu jadwal lain di masa depan (misal shift khusus per departemen) tanpa menambah menu baru di level utama.

### 2.3 Role: Admin/Owner

| Menu | Deskripsi |
|---|---|
| **Manajemen Akun** | Membuat/mengelola akun dengan hak akses HRD dan Admin/Owner. |
| **Data Jabatan** | CRUD: Nama Jabatan, Gaji Pokok, Tunjangan Jabatan, Uang Makan. **Per keputusan pembagian beban kerja (lihat catatan di bawah), akses ubah/tambah/hapus dipegang HRD; Admin/Owner memantau lewat Log Aktivitas, bukan approval gate di depan.** |
| **Potongan Gaji** | Kelola berbagai jenis potongan yang mempengaruhi gaji akhir karyawan. **Akses ubah/tambah/hapus juga dipegang HRD dengan pola pemantauan yang sama seperti Data Jabatan.** |
| **Tarif Lembur** | Atur multiplier tarif lembur per jam, dibedakan antara hari kerja biasa vs hari libur/weekend/nasional. |
| **Tunjangan Lainnya** | Buat tunjangan insidental (misal THR): nominal, tanggal pencairan, jabatan target. Otomatis ditambahkan ke slip gaji saat tanggal pencairan tiba. |
| **Pengaturan Umum** | Kuota cuti tahunan (default 12 hari/tahun, bisa diubah sesuai kebijakan perusahaan — berlaku untuk semua karyawan, bukan per jabatan), toleransi keterlambatan presensi. |
| **Laporan Gaji** | Sama seperti HRD: filter & cetak per bulan/tahun. |
| **Payroll Locking** | Mengunci data slip gaji bulan yang sudah difinalisasi agar tidak bisa diubah lagi — menjaga integritas data finansial untuk kebutuhan audit. |
| **Log Aktivitas (Audit Log)** | Melihat histori perubahan data sensitif — lihat detail di Bagian 4. |

#### 2.3.1 Detail Menu Potongan Gaji

Dikelompokkan menjadi 4 kategori agar mudah dikelola dan ditelusuri:

**a. Potongan BPJS (nominal/persentase bisa diatur, mengikuti aturan yang berlaku)**
- BPJS Kesehatan
- Jaminan Hari Tua (JHT) — BPJS Ketenagakerjaan
- Jaminan Pensiun (JP) — BPJS Ketenagakerjaan
- *(Jenis BPJS lain bisa ditambah bebas oleh Admin/Owner, misal JKK/JKM bila diperlukan)*

**b. Potongan Pajak**
- PPh 21 — dihitung **otomatis** oleh sistem berdasarkan PTKP, yang diambil dari data status pernikahan & jumlah tanggungan karyawan (bukan input manual per bulan).

**c. Potongan Kehadiran**
- Potongan Alpha — otomatis terpicu dari hasil Rekap Absensi (ketidakhadiran tanpa keterangan).
- Potongan Sakit — **default nonaktif**. Sakit dengan bukti surat tidak memotong gaji, sesuai aturan ketenagakerjaan. Admin/Owner bisa mengaktifkan secara manual hanya untuk kasus khusus (misal sakit berkepanjangan di luar kebijakan cuti sakit perusahaan).

**d. Potongan Kustom (opsional)**
- Admin/Owner dapat menambah jenis potongan baru di luar 3 kategori di atas (misal potongan koperasi, potongan kasbon), masing-masing dengan nama, nominal/persentase, dan status aktif/nonaktif.

**Catatan implementasi:** setiap jenis potongan sebaiknya punya flag `otomatis` (dihitung sistem, seperti Alpha & PPh21) vs `manual` (diinput/attach ke karyawan tertentu, seperti BPJS & potongan kustom), supaya proses generate slip gaji tahu mana yang perlu dihitung sendiri dan mana yang tinggal diambil dari master data.

---

## 3. Aturan Bisnis Penting (Business Rules)

1. **Cuti tahunan**: 12 hari/tahun (default, dapat diubah Admin), berlaku individual per karyawan, dihitung dari histori pengajuan yang disetujui — bukan kuota per jabatan atau per bulan.
2. **Sakit vs Alpha**: Sakit dengan bukti surat tidak memotong gaji. Yang memotong gaji hanya ketidakhadiran tanpa keterangan (alpha).
3. **Lembur**: Tarif berbeda antara hari kerja biasa dan hari libur, dihitung dari basis upah per jam (gaji pokok ÷ 173). Nilai default yang diimplementasikan: **1.5×** untuk hari kerja, **2.0×** untuk hari libur/nasional (simplifikasi dari skema bertingkat resmi Kepmenaker — lihat diskusi multiplier di riwayat perancangan; boleh disesuaikan lewat halaman Tarif Lembur).
4. **PPh 21**: Dihitung otomatis berdasarkan metode **TER (Tarif Efektif Rata-rata)** kategori A/B/C sesuai PP 58 Tahun 2023 — metode ini menggantikan perhitungan progresif manual bulanan yang berlaku sebelumnya, dan merupakan metode yang berlaku aktif untuk pemotongan PPh 21 bulanan saat ini. Kategori TER ditentukan dari `status_pernikahan` & `jumlah_tanggungan` (basis PTKP) di `pph21-service.ts`.
5. **Histori gaji**: Perubahan gaji pokok/jabatan tidak menimpa data lama — slip gaji bulan sebelumnya harus tetap mencerminkan nilai yang berlaku saat itu.
6. **Payroll locking**: Slip gaji yang sudah difinalisasi tidak boleh diubah lagi.
7. **Karyawan kontrak**: Otomatis nonaktif sistem saat durasi kontrak berakhir (berdasarkan tanggal masuk + durasi yang diset saat data dibuat).
8. **Pola maker-checker untuk Data Jabatan & Potongan Gaji**: HRD memegang akses ubah/tambah/hapus langsung (bukan lagi Admin/Owner secara eksklusif), sementara Admin/Owner berperan sebagai pengawas (*checker*) lewat Log Aktivitas — bukan gerbang persetujuan sebelum perubahan berlaku (bukan *pre-approval*, melainkan *post-hoc monitoring*). Pola ini dikenal sebagai **maker-checker** atau **four-eyes principle**, praktik standar di sistem finansial: satu pihak membuat/mengubah data (*maker* = HRD), pihak lain mengawasi jejaknya (*checker* = Admin/Owner). Tujuannya membebaskan Admin/Owner fokus mengawasi ketimbang mengerjakan detail operasional, sambil tetap menjaga akuntabilitas lewat audit trail yang lengkap (lihat Bagian 4). Keputusan ini murni perubahan **hak akses/otorisasi** di level aplikasi — tidak mengubah struktur tabel `jabatan` maupun `jenis_potongan` di database.
9. **Auto-reject pengajuan kadaluarsa**: Pengajuan berstatus `menunggu` yang tanggal pelaksanaannya sudah lewat tanpa diproses HRD akan otomatis ditolak sistem (dipicu saat `GET /api/pengajuan` dipanggil via `updateMany`, bukan cron terjadwal terpisah). **Terkonfirmasi**: kolom `diproses_oleh` dibiarkan `null` (kolom ini memang nullable sejak awal — lihat Bagian 7.2), dan alasan penolakan otomatis dicatat eksplisit di `catatan_penolakan` ("Otomatis Ditolak Sistem..."). **Trade-off yang disadari**: aksi ini *tidak* ditulis ke `log_aktivitas` (karena tidak memanggil `catatLog()`, menghindari kebutuhan akun *system* untuk `account_id` yang `NOT NULL`) — sehingga auto-reject tidak muncul di halaman Log Aktivitas, berbeda dari reject manual oleh HRD yang tetap tercatat. Ini penyimpangan kecil dari cakupan Bagian 4 (yang menyebut "approval/reject pengajuan" sebagai salah satu aksi yang wajib diaudit), namun tetap transparan lewat `catatan_penolakan` pada tabel `pengajuan` itu sendiri.
10. **Otomatisasi harian via cron**: Tiga endpoint di `app/api/cron/` menangani proses yang tidak bisa dipicu manual: `generate-alpha` (menetapkan status Alpha untuk karyawan yang tidak presensi sampai akhir hari), `nonaktif-kontrak` (menonaktifkan karyawan yang `tanggal_nonaktif_otomatis`-nya terlewati — memenuhi catatan Bagian 8.9), dan `saldo-cuti` (reset/inisialisasi kuota cuti tahunan). Ketiganya perlu dipicu penjadwal eksternal (Vercel Cron atau layanan sejenis), karena Next.js tidak memiliki cron job bawaan.
11. **Penanganan tanggal & zona waktu**: Seluruh perhitungan "hari ini" untuk kolom bertipe `DATE` (`absensi.tanggal`, dsb.) wajib dibakukan menggunakan `Date.UTC(year, month, date)` agar konsisten dengan zona waktu WIB (UTC+7) dan tidak bergeser ke hari sebelumnya — ini mengoreksi bug nyata yang sempat terjadi pada cache foto absensi.

---

## 4. Audit Log — Spesifikasi

**Tujuan**: mencatat histori perubahan pada data yang berdampak finansial/administratif — bukan mencatat semua aktivitas sistem.

**Data yang dicatat:**
- Perubahan nominal potongan (BPJS, PPh21, dll)
- Perubahan nominal tunjangan
- Perubahan data jabatan (gaji pokok, tunjangan, dll)
- Approval/reject pengajuan cuti/sakit/lembur
- Perubahan status karyawan (aktif ↔ nonaktif)
- Koreksi status absensi harian oleh HRD (misal Hadir → Alpha karena bukti foto tidak valid)
- Aksi payroll locking/unlocking

**Struktur tabel `log_aktivitas` (usulan):**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT (PK) | Auto increment |
| user_id | INT (FK) | Pengguna yang melakukan aksi |
| action | VARCHAR(20) | `create` / `update` / `delete` / `approve` / `reject` / `lock` / `unlock` |
| target_table | VARCHAR(50) | Nama tabel yang diubah, misal `jenis_potongan`, `pengajuan` |
| target_id | INT | ID baris yang diubah |
| old_value | JSON | Snapshot data sebelum perubahan |
| new_value | JSON | Snapshot data sesudah perubahan |
| created_at | TIMESTAMP | Waktu aksi terjadi |

**Catatan implementasi:**
- Gunakan format JSON untuk `old_value`/`new_value` agar satu tabel log bisa menangani semua jenis entitas tanpa perlu tabel log terpisah per modul.
- Tampilkan sebagai halaman "Log Aktivitas" khusus Admin/Owner, dengan filter tanggal, user, dan jenis aksi.
- Karyawan dan HRD tidak memiliki akses ke halaman ini.

**Filter yang tersedia di halaman Log Aktivitas** (semua opsional, bisa dikombinasikan, diimplementasikan sebagai query parameter di endpoint `GET /api/log-aktivitas`, tidak memerlukan kolom/tabel tambahan):

| Filter | Kolom yang dipakai | Kegunaan |
|---|---|---|
| Rentang tanggal | `created_at` | Misal "aktivitas minggu ini/bulan ini" |
| Pelaku | `account_id` | Fokus memantau 1 staf tertentu |
| Jenis aksi | `aksi` | Misal hanya yang `ubah` |
| Tabel yang disentuh | `tabel_target` | Misal hanya yang menyentuh `jabatan` |

**Preset filter cepat — "Perubahan Gaji & Jabatan":** 1 tombol yang otomatis menerapkan `tabel_target IN ('jabatan', 'jenis_potongan')` dan `aksi = 'ubah'`. Ini jadi alat pantau utama Admin/Owner untuk pola maker-checker pada Bagian 3 poin 8 — kolom "Perubahan" pada tabel hasil menampilkan perbandingan ringkas `nilai_lama` vs `nilai_baru` per field yang berubah (bukan dump mentah JSON).

---

## 5. Rangkuman Perubahan dari Draft Awal

| Aspek | Draft Awal | Versi Final |
|---|---|---|
| Kuota cuti | Di master jabatan, per bulan | Di Pengaturan Umum, per tahun, individual per karyawan |
| Potongan sakit | Digabung dengan alpha | Dipisah — sakit (dengan bukti) tidak memotong gaji |
| Approval pengajuan | Belum ada | HRD approve/reject dengan alasan |
| Tarif lembur | Belum ada | Master data tersendiri, beda hari kerja vs libur |
| Kalender libur nasional | Belum ada | Ditambahkan sebagai master data HRD |
| Data PPh 21 | Belum ada field pendukung | Field status pernikahan & tanggungan di data karyawan |
| Histori gaji | Belum ada | Data snapshot per bulan, tidak overwrite |
| Payroll locking | Belum ada | Ditambahkan di role Admin/Owner |
| Audit log | Belum ada | Ditambahkan, spesifikasi di Bagian 4 |
| Reset password karyawan | Belum ada | Ditambahkan di menu Data Karyawan (HRD) |

---

## 6. Langkah Selanjutnya

Dokumen ini menjadi dasar untuk penyusunan **ERD (Entity Relationship Diagram)** dan **LRS (Logical Record Structure)**, mencakup tabel-tabel inti seperti: `employee`, `jabatan`, `absensi`, `pengajuan`, `jadwal_kerja`, `hari_libur`, `jenis_potongan`, `tunjangan_lain`, `periode_penggajian`, `slip_gaji`, dan `log_aktivitas`.

---

## 7. LRS (Logical Record Structure)

**Stack:** Next.js (frontend + backend/API routes) + PostgreSQL.
**Konvensi penamaan:** `snake_case` untuk nama tabel & kolom (standar PostgreSQL, sekaligus serasi dengan konvensi Next.js/JavaScript), primary key `id` bertipe `SERIAL`, foreign key mengikuti pola `nama_tabel_singular_id`.

### 7.1 Daftar Tabel — Ringkasan

| No | Nama Tabel | Fungsi |
|---|---|---|
| 1 | `account` | Login HRD & Admin/Owner |
| 2 | `employee` | Data master karyawan + kredensial login |
| 3 | `jabatan` | Master jabatan & komponen gaji tetap |
| 4 | `jadwal_kerja` | Jadwal jam kerja per hari (Senin–Minggu) |
| 5 | `hari_libur` | Tanggal libur nasional/cuti bersama |
| 6 | `absensi` | Presensi harian karyawan |
| 7 | `pengajuan` | Pengajuan cuti/sakit/lembur (1 tabel gabungan) |
| 8 | `saldo_cuti` | Sisa kuota cuti per karyawan per tahun |
| 9 | `jenis_potongan` | Master jenis potongan (BPJS, PPh21, alpha, kustom), berlaku ke semua karyawan |
| 10 | `tarif_lembur` | Multiplier tarif lembur (hari kerja vs libur) |
| 11 | `tunjangan_lain` | Tunjangan insidental (misal THR) |
| 12 | `periode_penggajian` | Batch/periode payroll bulanan + status lock |
| 13 | `slip_gaji` | Ringkasan gaji per karyawan per periode (snapshot) |
| 14 | `slip_gaji_detail` | Rincian komponen tambahan/potongan per slip |
| 15 | `log_aktivitas` | Histori perubahan data sensitif |

### 7.2 Detail Struktur Tabel

**1. `account`** — akun login untuk HRD & Admin/Owner
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, ringan buat relasi FK & JOIN |
| name | VARCHAR(255) | | Nama pegawai HRD/Admin, batas longgar 255 karena tidak ada aturan pasti |
| username | VARCHAR(255) (UNIQUE) | | Identitas login; wajib UNIQUE agar tidak ada 2 akun dengan username sama |
| password_hash | VARCHAR(255) | | Hasil hashing (misal bcrypt, ~60 karakter), 255 memberi ruang lebih untuk algoritma hash lain
| role | ENUM('hrd','admin_owner') | | Nilai tetap dari daftar pilihan terbatas, bukan angka bermakna matematis |
| is_active | BOOLEAN | default true | Cuma 2 kemungkinan (aktif/nonaktif), tidak ada nilai ketiga |
| created_at | TIMESTAMP | | Butuh presisi tanggal + jam kapan akun dibuat |

**2. `employee`** — data master karyawan (sekaligus kredensial login role Karyawan)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| jabatan_id | INT (FK → jabatan.id) | | Tipe FK wajib sama dengan PK yang direferensikan (`jabatan.id` = INT) |
| nik | VARCHAR(16) (UNIQUE) | | Tepat 16 digit sesuai standar NIK; identitas bukan angka matematis, bisa diawali 0 |
| name | VARCHAR(150) | | Nama karyawan, batas wajar 150 karakter |
| username | VARCHAR(150) (UNIQUE) | | Identitas login; wajib UNIQUE agar tidak ada 2 karyawan dengan username sama |
| password_hash | VARCHAR(255) | | Hasil hashing, 255 memberi ruang lebih untuk algoritma hash apapun |
| gender | ENUM('L','P') | | Pilihan tetap 2 nilai berlabel, bukan boolean karena label L/P lebih jelas maknanya daripada true/false |
| join_date | DATE | | Kejadian di tanggal tertentu, tidak butuh jam |
| status_pernikahan | ENUM('TK','K') | untuk basis PTKP | Kategori tetap, dasar hitung PTKP |
| jumlah_tanggungan | SMALLINT | untuk basis PTKP | Angka kecil (maks 3) yang dipakai untuk operasi hitung PTKP, bukan sekadar label |
| bank_account_number | VARCHAR(10) | rekening BNI (fix, 1 bank saja), CHECK format 10 digit angka | Identitas eksternal (ditentukan bank), bisa diawali 0, tidak pernah dihitung matematis |
| photo_url | VARCHAR(255) | | Path/URL foto, 255 cukup untuk URL umum |
| status_kepegawaian | ENUM('tetap','kontrak') | | Kategori tetap, dua pilihan berlabel |
| durasi_kontrak_bulan | SMALLINT (nullable) | hanya jika status_kepegawaian = 'kontrak' | Angka kecil (wajar puluhan bulan), dipakai untuk kalkulasi tanggal nonaktif |
| tanggal_nonaktif_otomatis | DATE (nullable) | dihitung dari join_date + durasi_kontrak_bulan | Kejadian di tanggal tertentu, tidak butuh jam |
| is_active | BOOLEAN | default true | Cuma 2 kemungkinan status |
| created_at | TIMESTAMP | | Presisi tanggal + jam pembuatan data |

**3. `jabatan`** — master jabatan (khusus dikelola Admin/Owner, HRD view-only)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| nama | VARCHAR(150) | | Nama jabatan, batas wajar 150 karakter |
| gaji_pokok | NUMERIC(15,2) | | Nominal uang, butuh presisi eksak (bukan FLOAT) & bisa desimal (prorata) |
| tunjangan_jabatan | NUMERIC(15,2) | | Nominal uang, sama alasannya dengan gaji_pokok |
| uang_makan | NUMERIC(15,2) | | Nominal uang, tetap NUMERIC walau sering bulat, karena bisa kena prorata/desimal |
| created_at | TIMESTAMP | | Presisi tanggal + jam pembuatan data |

**4. `jadwal_kerja`** — jadwal kerja mingguan (dikelola HRD)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| hari | ENUM('senin'..'minggu') (UNIQUE) | | Kategori tetap 7 pilihan, bukan angka |
| jam_masuk | TIME (nullable) | kosong = libur mingguan | Ini template jam berulang mingguan, bukan kejadian di tanggal spesifik, jadi tidak butuh tanggal (beda dari absensi) |
| jam_pulang | TIME (nullable) | | Sama alasannya dengan jam_masuk |
| toleransi_telat_menit | SMALLINT | | Angka kecil (wajar puluhan menit), dipakai untuk kalkulasi |

**5. `hari_libur`** — libur nasional/cuti bersama (dikelola HRD)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| created_by | INT (FK → account.id) | | Tipe FK ikut tipe PK yang direferensikan (`account.id` = INT) |
| tanggal | DATE (UNIQUE) | | Kejadian di tanggal spesifik, tidak butuh jam |
| keterangan | VARCHAR(255) | misal "Idul Fitri" | Teks nama libur, 255 cukup longgar untuk deskripsi singkat |

**6. `absensi`** — presensi harian
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| employee_id | INT (FK → employee.id) | | Tipe FK ikut tipe PK employee.id |
| dikoreksi_oleh | INT (FK → account.id, nullable) | | Tipe FK ikut tipe PK account.id; nullable karena tidak semua baris dikoreksi |
| tanggal | DATE | | Anchor/jangkar record harian, wajib terisi walau jam_masuk kosong (kasus Alpha) |
| jam_masuk | TIME (nullable) | | Presisi waktu presensi; nullable karena kosong kalau Alpha/Cuti/Sakit |
| jam_pulang | TIME (nullable) | | Sama alasannya dengan jam_masuk |
| foto_masuk_url | VARCHAR(255) (nullable) | | Path/URL foto bukti, 255 cukup untuk URL umum |
| foto_pulang_url | VARCHAR(255) (nullable) | | Path/URL foto bukti, 255 cukup untuk URL umum |
| status | ENUM('hadir','telat','alpha','sakit','cuti','libur') | | Kategori tetap, lebih dari 2 pilihan sehingga bukan BOOLEAN |
| dikoreksi_hrd | BOOLEAN | default false | Cuma 2 kemungkinan: dikoreksi atau tidak |
| catatan_alasan | VARCHAR(10000) (nullable) | wajib diisi jika dikoreksi_hrd = true | Teks bebas panjang tidak terprediksi, dibatasi 10.000 karakter sebagai jaring pengaman |
| created_at | TIMESTAMP | | Presisi tanggal + jam pembuatan baris |
| *UNIQUE* | (employee_id, tanggal) | 1 karyawan 1 baris per tanggal | Constraint komposit, bukan kolom — mencegah duplikat baris per hari |

**7. `pengajuan`** — cuti/sakit/lembur dalam satu tabel (form dinamis di frontend)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| employee_id | INT (FK → employee.id) | | Tipe FK ikut tipe PK employee.id |
| diproses_oleh | INT (FK → account.id, nullable) | | Tipe FK ikut tipe PK account.id; nullable selama masih menunggu |
| jenis | ENUM('cuti','sakit','lembur') | | Kategori tetap 3 pilihan |
| tanggal_mulai_cuti | DATE (nullable) | khusus cuti — awal rentang | Kejadian di tanggal tertentu; nullable karena cuma dipakai jenis cuti |
| tanggal_selesai_cuti | DATE (nullable) | khusus cuti — akhir rentang | Sama alasannya dengan tanggal_mulai_cuti |
| alasan_cuti | VARCHAR(10000) (nullable) | khusus cuti | Teks bebas panjang tidak terprediksi |
| tanggal_sakit | DATE (nullable) | khusus sakit | Kejadian di tanggal tertentu, tidak butuh jam |
| tanggal_lembur | DATE (nullable) | khusus lembur | Kejadian di tanggal tertentu, menemani jam_mulai_lembur |
| jam_mulai_lembur | TIME (nullable) | khusus lembur | Presisi jam mulai lembur |
| jam_selesai_lembur | TIME (nullable) | khusus lembur | Presisi jam selesai lembur |
| total_menit_lembur | SMALLINT (nullable) | dihitung otomatis dari jam_mulai_lembur–jam_selesai_lembur (dalam menit) | Hasil pengurangan waktu itu bilangan bulat menit; lebih presisi & simpel daripada NUMERIC desimal jam |
| foto_bukti_url | VARCHAR(255) (nullable) | wajib untuk sakit & lembur | Path/URL foto bukti, 255 cukup untuk URL umum |
| status | ENUM('menunggu','disetujui','ditolak') | default 'menunggu' | Kategori tetap 3 pilihan |
| catatan_penolakan | VARCHAR(10000) (nullable) | | Teks bebas panjang tidak terprediksi |
| diajukan_pada | TIMESTAMP | dipakai validasi H-2 untuk cuti/lembur | Butuh presisi tanggal + jam untuk hitung selisih H-2 secara akurat |
| diproses_pada | TIMESTAMP (nullable) | | Presisi tanggal + jam kapan diproses |

**8. `saldo_cuti`** — sisa kuota cuti per karyawan per tahun
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| employee_id | INT (FK → employee.id) | | Tipe FK ikut tipe PK employee.id |
| tahun | SMALLINT | | Angka tahun kecil (misal 2026), bukan tanggal kejadian — DATE tidak relevan karena tidak ada makna hari/bulan spesifik |
| kuota | SMALLINT | default dari Pengaturan Umum (misal 12) | Angka kecil (wajar belasan hari), dipakai untuk operasi hitung |
| terpakai | SMALLINT | default 0, bertambah tiap cuti disetujui | Angka kecil, dipakai untuk operasi hitung & perbandingan dengan kuota |
| *UNIQUE* | (employee_id, tahun) | | Constraint komposit — 1 karyawan 1 baris per tahun |

**9. `jenis_potongan`** — master jenis potongan (dikelola Admin/Owner), berlaku otomatis ke semua karyawan
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| nama | VARCHAR(100) | misal "BPJS Kesehatan", "PPh 21" | Teks nama jenis potongan, 100 cukup untuk nama sejenis ini |
| kategori | ENUM('bpjs','pajak','kehadiran','kustom') | | Kategori tetap 4 pilihan |
| mode_hitung | ENUM('otomatis','manual') | otomatis = dihitung sistem (PPh21, Alpha) | Penanda sumber nilai (rumus vs input manual), 2 pilihan tetap |
| tipe_nilai | ENUM('nominal','persen') | | Penanda cara baca nilai_default, 2 pilihan tetap |
| nilai_default | NUMERIC(15,2) | | Nominal uang ATAU persentase, keduanya butuh presisi desimal eksak |
| status_aktif | BOOLEAN | default true (potongan sakit default false) | Cuma 2 kemungkinan aktif/nonaktif |

**10. `tarif_lembur`** — multiplier tarif lembur (dikelola Admin/Owner)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| tipe_hari | ENUM('kerja','libur') | libur mencakup weekend & tabel hari_libur | Kategori tetap 2 pilihan |
| multiplier | NUMERIC(4,2) | pengali dari upah per jam | Angka pengali berdesimal (1.5x, 2x), presisi kecil jadi cukup 4 digit total |

**11. `tunjangan_lain`** — tunjangan insidental (misal THR)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| jabatan_target_id | INT (FK → jabatan.id, nullable) | null = berlaku semua jabatan | Tipe FK ikut tipe PK jabatan.id |
| nama | VARCHAR(100) | misal "THR 2026" | Teks nama tunjangan, 100 cukup untuk nama sejenis ini |
| nominal | NUMERIC(15,2) | | Nominal uang, butuh presisi eksak |
| tanggal_pencairan | DATE | | Kejadian di tanggal tertentu, tidak butuh jam |
| status_aktif | BOOLEAN | | Cuma 2 kemungkinan aktif/nonaktif |

**12. `periode_penggajian`** — batch payroll bulanan
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| dikunci_oleh | INT (FK → account.id, nullable) | | Tipe FK ikut tipe PK account.id; nullable selagi masih draft |
| bulan | SMALLINT | 1–12 | Angka kecil terbatas 1-12, bukan tanggal kejadian |
| tahun | SMALLINT | | Angka tahun kecil, bukan tanggal kejadian |
| status | ENUM('draft','terkunci') | default 'draft' | Kategori tetap 2 pilihan |
| dikunci_pada | TIMESTAMP (nullable) | | Butuh presisi tanggal + jam kapan payroll dikunci |
| *UNIQUE* | (bulan, tahun) | | Constraint komposit — cegah generate payroll dobel di bulan sama |

**13. `slip_gaji`** — ringkasan gaji per karyawan per periode (snapshot, tidak overwrite)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| periode_penggajian_id | INT (FK → periode_penggajian.id) | | Tipe FK ikut tipe PK periode_penggajian.id |
| employee_id | INT (FK → employee.id) | | Tipe FK ikut tipe PK employee.id |
| gaji_pokok | NUMERIC(15,2) | snapshot dari gaji_pokok jabatan saat itu | Nominal uang, presisi eksak, snapshot agar histori tidak berubah |
| tunjangan_jabatan | NUMERIC(15,2) | snapshot dari tunjangan_jabatan | Sama alasannya dengan gaji_pokok |
| uang_makan | NUMERIC(15,2) | snapshot dari uang_makan | Sama alasannya dengan gaji_pokok |
| total_lembur | NUMERIC(15,2) | hasil hitung dari pengajuan lembur disetujui × tarif_lembur | Hasil akhir kalkulasi nominal uang, wajib presisi eksak |
| total_tunjangan_lain | NUMERIC(15,2) | | Nominal uang, presisi eksak |
| total_potongan | NUMERIC(15,2) | akumulasi dari slip_gaji_detail | Nominal uang, presisi eksak |
| gaji_bersih | NUMERIC(15,2) | hasil akhir | Nominal uang final, presisi eksak paling krusial |
| generated_at | TIMESTAMP | | Presisi tanggal + jam slip dibuat |
| *UNIQUE* | (periode_penggajian_id, employee_id) | | Constraint komposit — 1 karyawan 1 slip per periode |

**14. `slip_gaji_detail`** — rincian per komponen (fleksibel, tidak terbatas kolom tetap)
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| slip_gaji_id | INT (FK → slip_gaji.id) | | Tipe FK ikut tipe PK slip_gaji.id |
| tipe | ENUM('tambahan','potongan') | | Kategori tetap 2 pilihan |
| nama_komponen | VARCHAR(100) | misal "BPJS Kesehatan", "PPh 21", "Lembur" | Teks nama komponen, 100 cukup dan fleksibel menampung jenis apapun |
| nominal | NUMERIC(15,2) | | Nominal uang, presisi eksak |

**15. `log_aktivitas`** — histori perubahan data sensitif
| Field | Tipe | Keterangan | Alasan Tipe Data |
|---|---|---|---|
| id | SERIAL (PK) | | Auto-increment, standar PK |
| account_id | INT (FK → account.id) | | Tipe FK ikut tipe PK account.id |
| aksi | ENUM('buat','ubah','hapus','setujui','tolak','kunci','buka_kunci') | | Kategori tetap, mencegah typo aksi (misal "aproved") lolos ke database |
| tabel_target | VARCHAR(50) | | Teks nama tabel, 50 cukup karena nama tabel selalu pendek |
| id_target | INT | | Menyimpan nilai id baris lain yang tipenya juga INT (konsisten dengan PK tabel lain) |
| nilai_lama | JSONB (nullable) | | Struktur data fleksibel (snapshot kolom apapun), JSONB dipilih daripada JSON biasa karena lebih efisien di-query PostgreSQL |
| nilai_baru | JSONB (nullable) | | Sama alasannya dengan nilai_lama |
| created_at | TIMESTAMP | default now() | Presisi tanggal + jam aksi terjadi, krusial untuk audit trail |

### 7.3 Catatan Relasi Kunci

- `employee.jabatan_id` → `jabatan.id` (many-to-one): setiap karyawan punya satu jabatan aktif, tapi komponen gajinya di-*snapshot* ke `slip_gaji` tiap bulan agar histori tidak berubah saat jabatan/gaji diperbarui.
- `pengajuan` sebagai tabel gabungan (bukan 3 tabel terpisah) mempermudah query "riwayat pengajuan" & approval di satu tempat, dengan kolom-kolom yang bersifat nullable menyesuaikan `jenis`.
- `absensi` dan `pengajuan` sama-sama jadi sumber data untuk generate `slip_gaji` — proses payroll bulanan akan menggabungkan data dari `absensi` (alpha), `pengajuan` (lembur disetujui), `jenis_potongan` (berlaku otomatis ke semua karyawan), dan `tunjangan_lain` menjadi baris-baris di `slip_gaji_detail`.
- `periode_penggajian.status = 'terkunci'` menjadi syarat sebelum `slip_gaji` bisa ditampilkan/diunduh oleh karyawan di menu Slip Gaji.
- Semua aksi `ubah`/`hapus`/`setujui`/`tolak`/`kunci` pada tabel-tabel sensitif (`jenis_potongan`, `jabatan`, `pengajuan`, `absensi`, `periode_penggajian`, `employee.is_active`) sebaiknya dibungkus logika yang otomatis menulis ke `log_aktivitas` di level backend (API route Next.js), bukan mengandalkan input manual dari frontend.
- `employee.bank_account_number` di-fix untuk 1 bank saja (BNI), sehingga cukup diberi `CHECK` constraint format 10 digit angka (`~ '^[0-9]{10}$'`) tanpa perlu kolom `bank_name` terpisah. Kolom tetap bertipe `VARCHAR`, bukan tipe angka, karena bisa diawali digit `0` dan tidak pernah dipakai untuk operasi matematis.
- Setiap endpoint API di Next.js wajib melakukan **authorization check** (validasi sesi + role + kepemilikan data) sebelum mengembalikan data, khususnya untuk endpoint yang menerima parameter `id` langsung di URL (misal `/api/employee/[id]`), untuk mencegah celah *Insecure Direct Object Reference (IDOR)*.

---

## 8. Environment & Tech Stack

### 8.1 Ringkasan Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js (App Router, TypeScript) |
| Backend | Next.js API Routes (di folder yang sama, monorepo) |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Database | PostgreSQL (lokal, nama database: `Penggajian`) |
| Version control | Git + GitHub |

### 8.2 Status Saat Ini

- **Database sudah dibuat manual** langsung lewat SQL/pgAdmin — seluruh **15 tabel** pada Bagian 7.2 sudah ada dan berjalan di PostgreSQL lokal (database `Penggajian`), lengkap dengan seluruh `ENUM` type, `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, dan `CHECK` constraint sesuai LRS di dokumen ini.
- **Prisma schema BELUM ditulis manual** — karena database sudah ada duluan, alur yang benar adalah **introspeksi** (`npx prisma db pull`), bukan mendesain `schema.prisma` dari nol lalu migrate. Ini mencegah struktur dobel/tidak sinkron antara database asli dan schema Prisma.
- **Project Next.js belum di-scaffold** — akan dibuat di lokasi lokal di bawah ini, lalu dikembangkan lebih lanjut menggunakan Antigravity.

### 8.3 Lokasi & Repositori

- **Folder lokal:** `C:\Users\ALFA\Documents\belajar coding\myproject`
- **Repositori GitHub:** `https://github.com/alfarezaung762-bot/Penggajian.git`
- **Nama database PostgreSQL:** `Penggajian` (lihat Bagian 7 untuk detail skema)

### 8.4 Urutan Setup (sudah dilakukan / akan dilakukan)

1. Scaffold Next.js (TypeScript, App Router, Tailwind CSS diaktifkan saat setup) di folder lokal di atas.
2. Install Prisma (`prisma`, `@prisma/client`).
3. Set `DATABASE_URL` di `.env` mengarah ke database `Penggajian` yang sudah berisi 15 tabel.
4. Jalankan `npx prisma db pull` untuk menarik struktur tabel yang sudah ada ke `schema.prisma` (bukan menulis schema dari nol).
5. Jalankan `npx prisma generate` untuk membuat Prisma Client.
6. Pastikan `.env` masuk `.gitignore` (menyimpan kredensial database, tidak boleh ikut ter-push).
7. Init git, commit, push ke repositori GitHub di atas.

### 8.5 Catatan untuk Pengembangan Selanjutnya (Antigravity)

- Implementasi fitur mengikuti pembagian role & menu pada **Bagian 2** (Karyawan, HRD, Admin/Owner).
- Struktur tabel, tipe data, dan alasan pemilihannya mengikuti **Bagian 7** — jangan mengubah struktur tabel dari sisi kode (migration) tanpa menyesuaikan dokumen ini, karena database sudah dibuat manual dan menjadi sumber kebenaran (*source of truth*) saat ini, bukan `schema.prisma`.
- Aturan bisnis (validasi H-2 pengajuan, PPh 21/PTKP, tarif lembur, payroll locking, dsb.) ada di **Bagian 3**.
- Spesifikasi `audit_log` (sekarang bernama `log_aktivitas`) ada di **Bagian 4**.
- Setiap API route wajib menerapkan authorization check sesuai catatan di akhir **Bagian 7.3** sebelum mengakses/mengubah data.

### 8.6 Struktur Folder Backend (`app/api/`)

Folder dikelompokkan per resource (bukan per role), karena satu resource sering diakses beberapa role dengan hak berbeda — pembatasan role ditangani di dalam masing-masing `route.ts` (authorization check), bukan di struktur folder. Prefix `crud_` dipakai khusus untuk resource yang murni operasi CRUD data master; folder tanpa prefix `crud_` berarti ada aksi khusus di luar create-read-update-delete standar (misal approve, lock, clock-out).

```
app/api/
│
├── auth/
│   ├── login-staff/route.ts          → POST, login HRD/Admin (tabel account)
│   ├── login-employee/route.ts       → POST, login Karyawan (tabel employee)
│   ├── logout/route.ts               → POST, hapus session
│   └── crud_account/                 → khusus Admin, kelola akun HRD/Admin
│       ├── route.ts                  → GET (list), POST (tambah akun)
│       └── [id]/route.ts             → PATCH (edit), DELETE (nonaktifkan)
│
├── crud_employee/                    → Data Karyawan (HRD)
│   ├── route.ts                      → GET (list), POST (tambah karyawan)
│   └── [id]/
│       ├── route.ts                  → GET, PATCH (edit), DELETE (nonaktifkan)
│       └── reset-password/route.ts   → PATCH
│
├── crud_jabatan/                     → HRD (write, maker), Admin/Owner (read + pantau via log_aktivitas, checker)
│   ├── route.ts                      → GET (list), POST (khusus HRD)
│   └── [id]/route.ts                 → PATCH, DELETE (khusus HRD)
│
├── jadwal-kerja/                     → gabungan jam kerja mingguan + hari libur
│   ├── route.ts                      → GET (dibaca semua role, termasuk Karyawan untuk modal "Lihat Jadwal Kerja Saya"), PUT (update, khusus HRD & Admin/Owner)
│   └── hari-libur/
│       ├── route.ts                  → GET (list), POST (tambah, khusus HRD)
│       └── [id]/route.ts             → DELETE
│
├── absensi/
│   ├── route.ts                      → GET (list/rekap; parameter `bulan`&`tahun` untuk kalender kehadiran bulanan karyawan), POST (presensi masuk)
│   ├── clock-out/route.ts            → PATCH (presensi pulang)
│   └── [id]/route.ts                 → PATCH (koreksi HRD), GET (detail + foto)
│
├── pengajuan/
│   ├── route.ts                      → GET (riwayat; sekaligus memicu auto-reject pengajuan kadaluarsa — lihat Bagian 3 poin 9), POST (ajukan cuti/sakit/lembur)
│   └── [id]/
│       ├── route.ts                  → GET (detail)
│       └── proses/route.ts           → PATCH (approve/reject, khusus HRD)
│
├── saldo-cuti/
│   └── route.ts                      → GET (sisa kuota cuti karyawan)
│
├── rekap-absensi/
│   └── route.ts                      → GET (agregasi per bulan/karyawan, khusus HRD)
│
├── crud_pengaturan-payroll/          → gabungan jenis potongan, tarif lembur, tunjangan lain
│   ├── jenis-potongan/                       → HRD (write, maker), Admin/Owner (read + pantau via log_aktivitas, checker)
│   │   ├── route.ts                  → GET, POST (khusus HRD)
│   │   └── [id]/route.ts             → PATCH, DELETE (khusus HRD)
│   ├── tarif-lembur/                         → khusus Admin/Owner
│   │   └── route.ts                  → GET, PUT
│   └── tunjangan-lain/                       → khusus Admin/Owner
│       ├── route.ts                  → GET, POST
│       └── [id]/route.ts             → PATCH, DELETE
│
├── crud_pengaturan-umum/             → khusus Admin (kuota cuti tahunan, toleransi telat)
│   └── route.ts                      → GET, PUT
│
├── call_payroll/                     → memicu proses generate payroll (tabel periode_penggajian)
│   ├── route.ts                      → GET (list periode), POST (generate payroll baru)
│   └── [id]/
│       ├── route.ts                  → GET (detail 1 periode)
│       └── kunci/route.ts            → ⚠️ TIDAK DIPAKAI — endpoint sisa draft, tidak dipanggil frontend manapun. Sebaiknya dihapus (dead code) agar tidak membingungkan.
│
├── payroll/
│   └── lock/route.ts                 → PATCH, endpoint RESMI untuk kunci payroll (khusus Admin) — menerima `{ bulan, tahun }` di body, mengisi `dikunci_oleh`/`dikunci_pada`, dan mencatat log_aktivitas. Dipanggil dari tombol "🔒 Kunci Periode Penggajian" di `kelola_hrd_admin/payroll/page.tsx`.
│
├── cron/                             → dipicu penjadwal eksternal (Vercel Cron/sejenis), bukan diakses manual dari UI
│   ├── generate-alpha/route.ts       → GET, tetapkan status Alpha untuk karyawan yang tidak presensi sampai akhir hari
│   ├── nonaktif-kontrak/route.ts     → GET, nonaktifkan karyawan yang tanggal_nonaktif_otomatis-nya terlewati
│   └── saldo-cuti/route.ts           → GET, reset/inisialisasi kuota cuti tahunan
│
├── slip-gaji/
│   ├── route.ts                      → GET (karyawan: milik sendiri, HRD/Admin: semua)
│   └── [id]/route.ts                 → GET (detail + trigger download PDF)
│
├── laporan-gaji/
│   └── route.ts                      → GET (agregasi, filter bulan/tahun)
│
└── log-aktivitas/
    └── route.ts                      → GET (khusus Admin)
```

### 8.7 Layer Service — Kalkulasi Payroll

Logic kalkulasi gaji **tidak** ditulis langsung di `route.ts`. `route.ts` hanya berperan sebagai pintu masuk (cek otorisasi, panggil fungsi service, kembalikan response); seluruh rumus dan logic penggabungan data ditaruh di `lib/services/`, supaya mudah diuji terpisah (unit testing) dan tidak membuat `route.ts` membengkak.

```
lib/
├── prisma.ts                    → 1 instance PrismaClient dipakai bersama
├── session.ts                   → buat/baca/hapus session (dipakai login & middleware); memisahkan sesi akun pengelola (`account`) dan sesi karyawan (`employee`) secara independen
├── log-aktivitas.ts             → fungsi catatLog(...), tulis ke tabel log_aktivitas
├── api-response.ts              → standarisasi format response JSON: successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse
├── cloudinary_service/          → integrasi upload foto ke Cloudinary, 1 file per konteks
│   ├── cloudinary-config.ts     → inisialisasi client Cloudinary (baca dari .env)
│   ├── upload-foto-absensi.ts   → upload foto presensi masuk/pulang
│   ├── upload-foto-pengajuan.ts → upload foto bukti sakit/lembur
│   ├── upload-foto-profil.ts    → upload foto profil karyawan (employee)
│   └── delete-foto.ts           → hapus foto lama (misal saat foto profil direvisi)
├── validations/                 → skema validasi input (zod), 1 file per resource, pesan error berbahasa Indonesia
│   ├── employee-schema.ts
│   ├── pengajuan-schema.ts
│   └── absensi-schema.ts
└── services/
    ├── payroll-service.ts       → orkestrator utama, dipanggil dari POST /api/call_payroll
    ├── pph21-service.ts         → khusus hitung PTKP + PPh 21 metode TER A/B/C (lihat Bagian 3, poin 4)
    ├── lembur-service.ts        → khusus hitung nominal lembur (cek hari kerja/libur + multiplier)
    ├── absensi-service.ts       → khusus hitung jumlah alpha & potongan terkait
    └── pdf-service.ts           → generate slip gaji & laporan gaji jadi file PDF yang bisa diunduh

middleware.ts                    → (di root project) proteksi route berdasarkan session & role
```

**Alur `payroll-service.ts` per karyawan** (dipanggil berulang untuk setiap `employee` aktif saat generate payroll):

1. Ambil `gaji_pokok`, `tunjangan_jabatan`, `uang_makan` dari `jabatan` milik karyawan (snapshot ke `slip_gaji`, bukan referensi langsung — lihat Bagian 7.3).
2. Hitung total lembur: jumlahkan `total_menit_lembur` dari `pengajuan` jenis `lembur` berstatus `disetujui` pada periode berjalan, cek tiap tanggal ke `jadwal_kerja`/`hari_libur` untuk menentukan `tipe_hari`, kalikan `tarif_lembur.multiplier` yang sesuai.
3. Hitung total tunjangan lain: ambil `tunjangan_lain` yang `tanggal_pencairan` jatuh di periode ini dan `jabatan_target_id` cocok (atau kosong = berlaku semua jabatan).
4. Hitung total potongan: loop setiap `jenis_potongan` dengan `status_aktif = true` — jika `mode_hitung = 'manual'`, ambil `nilai_default` langsung; jika `mode_hitung = 'otomatis'`, panggil `pph21-service.ts` (kategori pajak) atau `absensi-service.ts` (kategori kehadiran/Alpha).
5. `gaji_bersih = gaji_pokok + tunjangan_jabatan + uang_makan + total_lembur + total_tunjangan_lain − total_potongan`.
6. Simpan hasil akhir ke `slip_gaji`, simpan rincian tiap komponen ke `slip_gaji_detail`.

### 8.8 Environment Variables (`.env`)

```dotenv
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/Penggajian?schema=public"

CLOUDINARY_CLOUD_NAME=isi_sesuai_dashboard_cloudinary
CLOUDINARY_API_KEY=isi_sesuai_dashboard_cloudinary
CLOUDINARY_API_SECRET=isi_sesuai_dashboard_cloudinary
```

Penyimpanan foto (presensi, bukti pengajuan, foto profil karyawan) menggunakan **Cloudinary**, diakses lewat `lib/cloudinary_service/`. File `.env` wajib masuk `.gitignore` dan tidak boleh ter-push ke repositori — kredensial di atas hanya untuk tahap pengembangan/testing dan akan diganti sebelum rilis produksi.

### 8.9 Modul Belum Terimplementasi (Catatan untuk Pengembangan Lanjutan)

Update per implementasi terakhir — item yang sudah selesai (auto-nonaktifkan kontrak via cron, `api-response.ts`, `prisma/seed.ts`) dihapus dari daftar ini. Sisa yang tercatat perlu dikerjakan:

- **Testing framework** (Vitest/Jest) — dibutuhkan untuk unit test layer `lib/services/`, khususnya `pph21-service.ts` dan `payroll-service.ts` yang paling kompleks (relevan dengan requirement studi kasus: pengujian unit & integrasi). Belum terkonfirmasi apakah sudah diinstal.
- **`.env.example`** — versi `.env` dengan nilai dikosongkan, aman untuk ikut di-commit ke repositori sebagai referensi variabel yang dibutuhkan.
- **Hapus endpoint mati**: `app/api/call_payroll/[id]/kunci/route.ts` tidak dipakai frontend manapun (endpoint resmi kunci payroll adalah `PATCH /api/payroll/lock`, terkonfirmasi lewat verifikasi ke tim pengembang) — sebaiknya dihapus untuk kebersihan kode.
- **Keputusan final**: auto-reject pengajuan kadaluarsa (Bagian 3 poin 9) sengaja **tidak** dicatat ke `log_aktivitas` — sudah diputuskan cukup transparan lewat `catatan_penolakan` pada tabel `pengajuan` itu sendiri, karena `log_aktivitas` difokuskan untuk mengawasi keputusan manusia (HRD/Admin), bukan keputusan otomatis berbasis aturan tetap. Tidak perlu perubahan lebih lanjut pada bagian ini.

### 8.10 Struktur Frontend (`app/`)

**Prinsip:** `layout.tsx` dipakai (wajib, bukan opsional) untuk membungkus header/sidebar/footer yang berulang di seluruh halaman dashboard — ini bukan "component" yang dipecah sesuai preferensi awal untuk menghindari kerumitan, melainkan mekanisme bawaan Next.js App Router. Yang **disederhanakan** dari preferensi awal adalah isi tiap `page.tsx`: konten ditulis lengkap langsung di file itu, tidak dipecah lagi menjadi component-component kecil terpisah.

**Struktur folder final:**

```
app/
├── login/
│   └── page.tsx                          → 1 halaman polos, tanpa layout dashboard
│
└── (dashboard)/
    ├── layout.tsx                        → header + sidebar + footer, sidebar menyesuaikan role
    │
    ├── karyawan/                         → khusus role karyawan
    │   ├── absensi/page.tsx
    │   ├── pengajuan/page.tsx
    │   └── slip-gaji/page.tsx
    │
    └── kelola_hrd_admin/                 → SEMUA halaman HRD & Admin/Owner, 1 folder rata
        ├── data-karyawan/page.tsx        → hrd & admin_owner
        ├── jabatan/page.tsx              → hrd & admin_owner (lihat catatan akses di bawah)
        ├── jadwal-kerja/page.tsx         → hrd & admin_owner (termasuk sub-tab hari libur)
        ├── approval-pengajuan/page.tsx   → hrd & admin_owner
        ├── rekap-absensi/page.tsx        → hrd & admin_owner
        ├── laporan-gaji/page.tsx         → hrd & admin_owner
        ├── potongan-gaji/page.tsx        → hrd & admin_owner (lihat catatan akses di bawah)
        ├── akun/page.tsx                 → admin_owner saja
        ├── tarif-lembur/page.tsx         → admin_owner saja
        ├── tunjangan-lain/page.tsx       → admin_owner saja
        ├── pengaturan-umum/page.tsx      → admin_owner saja
        ├── payroll/page.tsx              → admin_owner saja
        └── log-aktivitas/page.tsx        → admin_owner saja
```

Total **17 halaman** (3 karyawan + 13 kelola_hrd_admin + 1 login). Folder `(dashboard)` memakai tanda kurung — ini *route group* Next.js: mengelompokkan folder secara logis dan otomatis mewarisi `layout.tsx` yang sama, tanpa memengaruhi URL (URL tetap `/kelola_hrd_admin/jabatan`, bukan `/dashboard/kelola_hrd_admin/jabatan`).

**Pola akses per halaman di dalam `kelola_hrd_admin/`:**

| Kategori | Contoh halaman | Pola |
|---|---|---|
| Shared, sama persis untuk kedua role | `data-karyawan`, `jadwal-kerja`, `approval-pengajuan`, `rekap-absensi`, `laporan-gaji` | Tidak ada perbedaan tampilan/hak |
| Shared, tapi HRD full akses (maker), Admin memantau (checker) | `jabatan`, `potongan-gaji`, `tarif-lembur` | Lihat Bagian 3 poin 8 — HRD CRUD/update langsung, Admin melihat + memantau lewat `log-aktivitas` |
| Eksklusif Admin/Owner | `akun`, `tunjangan-lain`, `pengaturan-umum`, `payroll`, `log-aktivitas` | HRD tidak melihat menu ini sama sekali di sidebar |

**Page-level guard** (lapisan UX, bukan lapisan keamanan utama): tiap `page.tsx` yang eksklusif Admin/Owner memeriksa role di awal komponen dan menampilkan pesan/redirect jika role tidak sesuai — ini murni supaya HRD tidak melihat halaman kosong bila nekat mengetik URL manual. **Proteksi sesungguhnya tetap di backend** (`route.ts`, sesuai authorization check Bagian 7.3) — independen dari tampilan frontend, sehingga tetap aman meskipun lapisan UX ini di-bypass.

**Sidebar** di `layout.tsx` memfilter menu yang ditampilkan sesuai role yang login: karyawan hanya melihat 3 menu di atas, HRD melihat 13 menu `kelola_hrd_admin` minus 5 yang eksklusif Admin, Admin/Owner melihat semua 13 menu.

### 8.11 Fitur UI/UX Tambahan Terimplementasi

Fitur berikut sudah diimplementasikan pada iterasi pengembangan terakhir, melengkapi (bukan menggantikan) spesifikasi Bagian 8.10:

- **Modal CRUD terstandarisasi** — halaman `jabatan`, `potongan-gaji`, `jadwal-kerja`/`hari-libur`, dan `tunjangan-lain` menggunakan pola tombol aksi teratas (misal "+ Tambah Jabatan Baru") yang membuka modal dialog, dilengkapi pencarian real-time dan status badge berwarna, menggantikan pola form samping (*side-form*) pada draf awal.
- **Log Aktivitas — Visual Diff Viewer**: modal pembanding `nilai_lama` vs `nilai_baru` ditampilkan sebagai tabel terstruktur berwarna (hijau = ditambah, merah = diubah), bukan dump JSON mentah — sesuai kebutuhan pemantauan maker-checker di Bagian 3 poin 8.
- **Akses Pengaturan & Audit Log Tarif Lembur untuk HRD**: halaman `tarif-lembur` dan endpoint `PUT /api/tarif-lembur` kini dibuka untuk role HRD (Maker) selain Admin/Owner, di mana setiap pembaruan faktor multiplier lembur (hari kerja & hari libur) otomatis mencatat `nilai_lama` vs `nilai_baru` ke `log_aktivitas`.
- **Kalender kehadiran bulanan** pada portal Absensi Karyawan: grid 7 kolom dengan legenda warna per status (Hadir/Telat/Sakit/Cuti/Izin/Lembur/Alpha/Libur), memanfaatkan `join_date` pada `employee` untuk menampilkan status netral "Belum Bergabung" pada tanggal sebelum karyawan mulai bekerja — tanpa memerlukan kolom/tabel baru.
- **Modal "Lihat Jadwal Kerja Saya"** pada portal Karyawan — akses baca (read-only) ke `GET /api/jadwal-kerja` kini juga dibuka untuk role karyawan (sebelumnya hanya HRD/Admin), khusus untuk menampilkan jam kerja & toleransi keterlambatan miliknya sendiri.
- **Watermark timestamp** pada foto selfie absensi (tanggal, jam, nama perusahaan) dibubuhkan otomatis di canvas frontend saat pengambilan foto — lapisan verifikasi tambahan di luar data `created_at` yang sudah tersimpan di database.
- **Notifikasi real-time sidebar**: perubahan status pengajuan memicu custom browser event yang memperbarui badge jumlah pending tanpa reload halaman.
- **Validasi & pesan error berbahasa Indonesia** pada seluruh skema `zod` di `lib/validations/`.
- **Master Potongan Gaji — 3 Metode Perhitungan Eksplisit & Guidance Banner**: Pada modal dialog Tambah/Edit Jenis Potongan (`/kelola_hrd_admin/potongan-gaji`), sistem menyediakan 3 opsi metode perhitungan yang eksplisit (*1. Berdasarkan Perhitungan Pajak PPh 21*, *2. Berdasarkan Perhitungan Absensi Denda Alpha*, dan *3. Manual Input Rate % / Nominal Rp Fixed*) dilengkapi banner petunjuk interaktif dan tooltip penjelas — memastikan HRD dan Owner memahami perbedaan mekanisme kalkulasi otomatis versus manual tanpa risiko kesalahan pengisian mode hitung pada potongan kustom (seperti Potongan Keamanan/Seragam).
- **Pengaturan Tanggal Cutoff Absensi & Transfer BNI (Opsi B Header Laporan BNI)**: Tombol `[ ✏️ Atur Tanggal Transfer & Cutoff ]` dipasang pada header layar Laporan Gaji & BNI (`/kelola_hrd_admin/laporan-gaji`) dilengkapi modal dialog interaktif dan 4 Aturan Pembatasan Ketat (*Strict Guardrails*: 1. Hanya aktif saat status periode `draft`, 2. Rentang tanggal cutoff `tanggal_selesai` wajib di antara tanggal 20 s/d akhir bulan, 3. Otomatis menghitung ulang draf payroll 31 karyawan saat cutoff disimpan, 4. Perekaman Audit Trail ke `log_aktivitas`).
- **Fitur Toggle Buka Kunci Periode Gaji (Unlock Period)**: API `PATCH /api/call_payroll/[id]/kunci` dan tombol `[ 🔓 Buka Kunci Periode (Unlock) ]` pada layar `/kelola_hrd_admin/payroll` memungkinkan role Admin/Owner mengembalikan status periode penggajian dari `terkunci` kembali ke `draft` jika diperlukan revisi data absensi/lembur oleh HRD sebelum pencairan final.
- **Master Kalender Hari Libur Nasional (1 Juni s/d 31 Agustus 2026)**: Menambahkan 4 Hari Libur Resmi Kalender Indonesia pada tabel `hari_libur` (*Hari Lahir Pancasila*, *Tahun Baru Islam 1448H*, *Hari Kemerdekaan RI ke-81*, *Maulid Nabi Muhammad SAW*) yang otomatis terisi pada layar `Pengaturan Shift & Kalender Libur` (`/kelola_hrd_admin/jadwal-kerja`).
- **Skrip Seeding Clean Reset Multi-Bulan (`prisma/seed.ts`)**: Skrip seeding idempotent yang mendaftarkan 33 total akun (3 akun demo bawaan `budi`, `hrd`, `admin` + 30 karyawan baru dengan format `nama_lengkap`), 3 Periode Penggajian (Juni 2026 Terkunci, Juli 2026 Terkunci, Agustus 2026 Draft), riwayat absensi multi-bulan 1 Juni s/d 2 Agustus 2026 (~1.426 record dengan foto avatar selfie), serta audit log aktivitas historis.
- **Dukungan Foto Profil Avatar Karyawan & Cloudinary Upload**: Halaman kelola Data Karyawan (`/kelola_hrd_admin/data-karyawan`) kini dilengkapi tampilan foto avatar pada tabel directory utama & modal detail, serta komponen Upload Foto Profil baru pada modal dialog Tambah/Edit Karyawan yang terintegrasi dengan service Cloudinary (`uploadFotoProfil`) berbasis Base64. Seluruh 31 karyawan dummy pada skrip seeding (`prisma/seed.ts`) telah terisi dengan `photo_url` avatar unik secara otomatis.


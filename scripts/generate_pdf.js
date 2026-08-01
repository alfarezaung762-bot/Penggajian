const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

function buildFullPdf() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 36, // 36pt = 0.5 in, printable width = 523pt
    bufferPages: true,
  })

  const pdfPath1 = path.join(__dirname, '..', 'dokumentasi', 'Dokumentasi_Rumus_dan_Kalkulasi_Penggajian.pdf')
  const pdfPath2 = path.join(__dirname, '..', 'dokumentasi', 'Dokumentasi Master Rumus & Arsitektur Kalkulasi Penggajian (Payroll Engine).pdf')

  const stream1 = fs.createWriteStream(pdfPath1)
  doc.pipe(stream1)

  const margin = 36
  const pageWidth = 523 // 595 - 72

  function checkPageBreak(neededHeight = 40) {
    if (doc.y + neededHeight > 770) {
      doc.addPage()
      return true
    }
    return false
  }

  // --- HEADER COVER / TOP TITLE BANNER ---
  doc.rect(margin, 36, pageWidth, 55).fill('#0f172a')
  doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('PT SANTOSO MAKMUR JAYA', margin + 15, 46)
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#38bdf8').text('Dokumentasi Master Rumus & Arsitektur Kalkulasi Penggajian (Payroll Engine)', margin + 15, 66)

  doc.y = 105

  // INTRO TEXT
  doc.fillColor('#334155').fontSize(9).font('Helvetica-Oblique').text(
    'Dokumen ini menjelaskan secara menyeluruh seluruh rumus matematika, logika bisnis, serta alur kalkulasi penggajian yang diterapkan pada sistem aplikasi penggajian (termasuk penjelasan perbedaan Mode Potongan Otomatis vs Manual).',
    margin, doc.y, { width: pageWidth, lineGap: 2 }
  )

  doc.moveDown(1)

  // ==========================================
  // SECTION 1: RUMUS PERHITUNGAN SLIP GAJI
  // ==========================================
  checkPageBreak(80)
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('1. Rumus Perhitungan Slip Gaji Per Karyawan (Take Home Pay)')
  doc.moveDown(0.3)

  doc.fillColor('#334155').fontSize(9).font('Helvetica').text(
    'Uang yang benar-benar dibawa pulang oleh 1 orang karyawan dan masuk ke rekening bank mereka setiap bulan (Take Home Pay) dihitung dengan rumus sederhana:'
  )
  doc.moveDown(0.5)

  // Main Formula Callout Box
  const yFormula = doc.y
  doc.rect(margin, yFormula, pageWidth, 35).fill('#f1f5f9').stroke('#cbd5e1')
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(
    'Gaji Bersih (Take Home Pay) = Total Pendapatan (Uang Diterima) - Total Potongan (Kewajiban)',
    margin + 12, yFormula + 11
  )
  doc.y = yFormula + 45
  doc.moveDown(0.8)

  // Table 1: UI/UX Pemetaan Kode
  checkPageBreak(120)
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Pemetaan Nama Fitur UI/UX dengan Berkas Kode Sumber (Source Code):')
  doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(
    'Berikut adalah pemetaan antara Nama Menu di Layar Tampilan (UI/UX) dengan Berkas Kode Backend & Frontend yang menjalankannya:'
  )
  doc.moveDown(0.5)

  const uiMapData = [
    ['Nama Menu Layar (UI/UX)', 'Lokasi Halaman (URL)', 'Berkas Kode Utama', 'Fungsi & Keterangan Operasional'],
    ['Proses Penggajian (Payroll)', '/kelola_hrd_admin/payroll', 'lib/services/payroll-service.ts\napp/api/call_payroll/route.ts', 'Mesin Penghitung Utama Payroll: Tempat Admin menekan Hitung Payroll untuk menjalankan kalkulasi seluruh pendapatan & potongan karyawan, serta membekukan status (Lock Periode).'],
    ['Tarif Lembur', '/kelola_hrd_admin/tarif-lembur', 'lib/services/lembur-service.ts', 'Menghitung upah lembur per jam, multiplier lembur hari kerja (1.5x, 2.0x), & hari libur (2.0x, 3.0x, 4.0x).'],
    ['Potongan Gaji & Absensi', '/kelola_hrd_admin/potongan-gaji', 'lib/services/absensi-service.ts', 'Menghitung denda sanksi ketidakhadiran tanpa izin secara otomatis (Hari Alpha x (Gaji Pokok / 30)).'],
    ['Kalkulator Pajak PPh 21', 'Terintegrasi di Engine', 'lib/services/pph21-service.ts', 'Menghitung Biaya Jabatan (5%), PTKP (TK/0 s/d K/3), PKP, & Tarif Progresif Pajak PPh 21 (5%, 15%, 25%, 30%).'],
    ['Laporan Gaji (BNI)', '/kelola_hrd_admin/laporan-gaji', 'app/api/laporan-gaji/route.ts\nlib/services/pdf-service.ts', 'Rekapitulasi pencairan dana seluruh karyawan & cetak PDF instruksi transfer Bank BNI.'],
    ['Slip Gaji Saya', '/karyawan/slip-gaji', 'app/(dashboard)/karyawan/slip-gaji/page.tsx', 'Portal karyawan untuk melihat rincian gaji pribadi & mengunduh PDF slip gaji resmi.']
  ]

  renderTable(doc, uiMapData, [110, 110, 110, 193], margin)
  doc.moveDown(1)

  // Penjabaran Lengkap Rumus Bahasa Awam
  checkPageBreak(80)
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Penjabaran Lengkap Rumus Bahasa Awam:')
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Jika rumus di atas dibongkar satu per satu seluruh komponen isinya, maka persamaannya adalah:\n' +
    'Gaji Bersih (Uang Ditransfer ke Rekening Karyawan) =\n' +
    '(Gaji Pokok + Tunjangan Jabatan + Uang Makan + Upah Lembur + Tunjangan Lain) — (Total Pendapatan / Uang Masuk)\n' +
    '-\n' +
    '(BPJS + Potongan Alpha + PPh 21 + Potongan Lain) — (Total Potongan / Uang Keluar)',
    { lineGap: 2 }
  )
  doc.moveDown(0.8)

  // Penjelasan Bahasa Manusia A & B
  checkPageBreak(120)
  doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Penjelasan Bahasa Manusia (Bukan Bahasa Sistem):')
  doc.moveDown(0.3)

  doc.fillColor('#0369a1').fontSize(9).font('Helvetica-Bold').text('A. TOTAL PENDAPATAN (Semua Uang Masuk yang Menjadi Hak Karyawan)')
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Yaitu penjumlahan seluruh uang yang berhak didapatkan karyawan pada bulan tersebut:\n' +
    '1. Gaji Pokok: Standar upah dasar bulanan sesuai posisi/jabatan karyawan.\n' +
    '2. Tunjangan Jabatan: Uang tambahan atas beban tanggung jawab posisi, jabatan manajerial, atau keahlian khusus.\n' +
    '3. Uang Makan: Total uang makan bulanan, dihitung dari tarif makan per hari dikali jumlah hari kerja yang diikuti karyawan.\n' +
    '4. Upah Lembur: Uang tambahan jika karyawan bekerja melebihi jam kerja normal (dihitung per jam sesuai aturan ketenagakerjaan).\n' +
    '5. Tunjangan Lain: Bonus tambahan dari perusahaan (seperti THR, bonus kinerja, atau tunjangan khusus).',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(0.5)

  doc.fillColor('#b91c1c').fontSize(9).font('Helvetica-Bold').text('B. TOTAL POTONGAN (Semua Uang Keluar yang Harus Dipotong)')
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Yaitu penjumlahan seluruh kewajiban iuran, pajak, dan denda yang memotong gaji kotor karyawan:\n' +
    '1. Potongan BPJS: Iuran wajib jaminan sosial karyawan (BPJS Kesehatan 1%, BPJS Hari Tua/JHT 2%, dan BPJS Pensiun/JP 1%).\n' +
    '2. Potongan Alpha: Denda pemotongan gaji akibat karyawan tidak hadir bekerja tanpa surat izin/keterangan yang sah.\n' +
    '3. Potongan PPh 21: Pajak penghasilan resmi karyawan yang disetorkan ke kas negara (dihitung otomatis sesuai batas PTKP & status nikah/tanggungan).\n' +
    '4. Potongan Lain (Kategori Kustom): Jenis potongan bebas yang ditambahkan oleh HRD pada menu Potongan Gaji (kategori: kustom), seperti Potongan Koperasi, Potongan Seragam, Potongan Denda, atau potongan kustom lainnya.',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(0.8)

  // Contoh Perhitungan Praktis Box
  checkPageBreak(70)
  doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Contoh Perhitungan Praktis:')
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Misalkan bulan ini seorang karyawan memiliki rincian sebagai berikut:\n' +
    '• Total Uang Masuk (Pendapatan): Gaji Pokok Rp 7.000.000 + Tunjangan Jabatan Rp 1.000.000 + Uang Makan Rp 500.000 = Rp 8.500.000\n' +
    '• Total Uang Keluar (Potongan): Iuran BPJS Rp 280.000 + Pajak PPh 21 Rp 162.500 = Rp 442.500\n' +
    '• Uang Bersih yang Ditransfer (Take Home Pay):\n' +
    '  Rp 8.500.000 (Total Pendapatan) - Rp 442.500 (Total Potongan) = Rp 8.057.500',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(1.5)

  // ==========================================
  // SECTION 2: KOMPONEN PENDAPATAN
  // ==========================================
  checkPageBreak(120)
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('2. Komponen Pendapatan (Earnings)')
  doc.moveDown(0.3)
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Total Pendapatan dihitung dengan mengumpulkan 5 komponen utama:\n' +
    'Total Pendapatan = Gaji Pokok + Tunjangan Jabatan + Uang Makan + Upah Lembur + Tunjangan Lain',
    { lineGap: 2 }
  )
  doc.moveDown(0.5)

  const earningsTableData = [
    ['Komponen', 'Kode Service', 'Cara & Rumus Perhitungan'],
    ['1. Gaji Pokok', 'lib/services/payroll-service.ts', 'Diambil langsung dari nilai nominal gaji_pokok pada Master Jabatan karyawan.'],
    ['2. Tunjangan Jabatan (Tanggung Jawab & Struktural)', 'lib/services/payroll-service.ts', 'Diambil dari tunjangan_jabatan pada Master Jabatan. Mencakup kompensasi tanggung jawab posisi, level manajerial, dan keahlian struktural.'],
    ['3. Uang Makan', 'lib/services/payroll-service.ts', 'Nominal Uang Makan per Hari (dari Jabatan) x Jumlah Hari Kehadiran Sah (Hadir/Cuti/Sakit).'],
    ['4. Upah Lembur', 'lib/services/lembur-service.ts', 'a. Tarif per Jam: Upah per Jam = (1 / 173) x (Gaji Pokok + Tunjangan Jabatan)\nb. Jam Lembur Hari Kerja: Jam ke-1 = 1.5 x Upah per Jam, Jam ke-2 dst = 2.0 x Upah per Jam.\nc. Jam Lembur Hari Libur: Jam 1-7 = 2.0 x Upah per Jam, Jam ke-8 = 3.0 x Upah per Jam, Jam ke-9+ = 4.0 x Upah per Jam.'],
    ['5. Tunjangan Lainnya', 'lib/services/payroll-service.ts', 'Tunjangan kustom tambahan (misal: Bonus Kinerja, THR, Tunjangan Transportasi) yang dibuat oleh Admin.']
  ]

  renderTable(doc, earningsTableData, [120, 110, 293], margin)
  doc.moveDown(0.8)

  checkPageBreak(60)
  doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Oblique').text(
    'Catatan Penting Pengaruh Lembur terhadap Pajak PPh 21:\n' +
    '• Upah Lembur menambah Total Gaji Kotor (Bruto): Jika Gaji Pokok Rp 6 Juta + Lembur Rp 2 Juta = Gaji Kotor Rp 8.000.000.\n' +
    '• Angka Rp 8.000.000 inilah yang dimasukkan ke kalkulator PPh 21, sehingga pajak PPh 21 pada bulan tersebut otomatis menyesuaikan sedikit lebih tinggi sesuai penghasilan riil bulan itu.\n' +
    '• Potongan Alpha: Berfungsi sebagai denda pemotongan pada kelompok Total Potongan (Deductions) yang mengurangi Gaji Kotor untuk menghasilkan Gaji Bersih (Take Home Pay).',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(1.5)

  // ==========================================
  // SECTION 3: KOMPONEN POTONGAN GAJI
  // ==========================================
  checkPageBreak(120)
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('3. Komponen Potongan Gaji (Deductions — Otomatis vs Manual)')
  doc.moveDown(0.3)
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Total Potongan dihitung dari penjumlahan 4 jenis pemotongan:\n' +
    'Total Potongan = Potongan BPJS + Potongan Alpha + Potongan PPh 21 + Potongan Kustom',
    { lineGap: 2 }
  )
  doc.moveDown(0.5)

  doc.fillColor('#d97706').fontSize(9.5).font('Helvetica-Bold').text('A. Mode Hitung MANUAL (Configured Rate / Fixed Percentage)')
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Menggunakan patokan nilai tetap persentase (%) atau nominal yang telah diatur oleh HRD di Master Potongan. Sistem menghitung berdasarkan perkalian persentase terhadap Gaji Pokok.\n' +
    '1. BPJS Kesehatan (1%): Potongan BPJSKes = 1% x Gaji Pokok\n' +
    '2. BPJS Ketenagakerjaan JHT (2%): Potongan JHT = 2% x Gaji Pokok\n' +
    '3. BPJS Ketenagakerjaan JP (1%): Potongan JP = 1% x Gaji Pokok\n' +
    '4. Potongan Kustom / Pinjaman: Nominal fixed (misal denda Rp 50.000 atau iuran seragam Rp 50.000).',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(0.8)

  doc.fillColor('#2563eb').fontSize(9.5).font('Helvetica-Bold').text('B. Mode Hitung OTOMATIS (Dynamic System Algorithm)')
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Dihitung secara dinamis oleh rumus algoritma backend saat kalkulasi payroll dijalankan, tanpa perlu dihitung manual oleh HRD:\n' +
    '1. Potongan Alpha (Absen Tanpa Keterangan) (lib/services/absensi-service.ts):\n' +
    '   Potongan Alpha = Total Hari Alpha x (Gaji Pokok / 30 Hari)\n' +
    '   Sistem secara otomatis menghitung berapa hari karyawan tidak hadir tanpa keterangan pada periode tersebut dari tabel absensi.\n\n' +
    '2. PPh 21 Pajak Penghasilan (lib/services/pph21-service.ts):\n' +
    '   • Lokasi Berkas Kode Perhitungan:\n' +
    '     - Rumus PTKP & Pajak: lib/services/pph21-service.ts (Fungsi hitungPTKP & hitungPPh21Bulanan).\n' +
    '     - Pemanggilan di Engine Payroll: lib/services/payroll-service.ts (Line 90-94).\n' +
    '     - Tampilan Kode Status PTKP Slip Gaji: app/api/payroll/route.ts & app/(dashboard)/karyawan/slip-gaji/page.tsx.\n\n' +
    '   • Tahap 1 (Biaya Jabatan & Neto):\n' +
    '     Biaya Jabatan = 5% x Gaji Bruto Bulanan (Maksimal Rp 500.000)\n' +
    '     Neto Tahunan = (Gaji Bruto Bulanan - Biaya Jabatan) x 12 Bulan\n\n' +
    '   • Tahap 2 (PTKP & PKP):\n' +
    '     PTKP (Penghasilan Tidak Kena Pajak) adalah Batas Bebas Pajak Resmi Pemerintah yang ditentukan oleh status pernikahan dan jumlah tanggungan anak (Maksimal 3 Anak):',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(0.5)

  // PTKP Table
  const ptkpTableData = [
    ['Kode Status PTKP', 'Singkatan & Kepanjangan', 'Jumlah Tanggungan', 'Batas Bebas Pajak (PTKP / Tahun)'],
    ['TK/0', 'Tidak Kawin (Lajang)', '0 Tanggungan', 'Rp 54.000.000'],
    ['TK/1', 'Tidak Kawin (Lajang)', '1 Tanggungan', 'Rp 58.500.000'],
    ['TK/2', 'Tidak Kawin (Lajang)', '2 Tanggungan', 'Rp 63.000.000'],
    ['TK/3', 'Tidak Kawin (Lajang)', '3 Tanggungan (Maksimal)', 'Rp 67.500.000'],
    ['K/0', 'Kawin (Menikah)', '0 Tanggungan', 'Rp 58.500.000'],
    ['K/1', 'Kawin (Menikah)', '1 Tanggungan', 'Rp 63.000.000'],
    ['K/2', 'Kawin (Menikah)', '2 Tanggungan', 'Rp 67.500.000'],
    ['K/3', 'Kawin (Menikah)', '3 Tanggungan (Maksimal)', 'Rp 72.000.000']
  ]

  renderTable(doc, ptkpTableData, [100, 150, 120, 153], margin)
  doc.moveDown(0.5)

  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    '*Rumus PKP (Penghasilan Kena Pajak) = Neto Tahunan - Nilai PTKP Sesuai Kategori.\n\n' +
    '   • Tahap 3 (Tarif Progresif Tahunan):\n' +
    '     - Lapisan 1 (Rp 0 s/d Rp 60 Juta): 5%\n' +
    '     - Lapisan 2 (Rp 60 Juta s/d Rp 250 Juta): 15%\n' +
    '     - Lapisan 3 (Rp 250 Juta s/d Rp 500 Juta): 25%\n' +
    '     - Lapisan 4 (> Rp 500 Juta): 30%\n\n' +
    '   • Tahap 4 (Potongan Bulanan):\n' +
    '     PPh 21 Bulanan = Total Pajak Tahunan / 12 Bulan',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(1.5)

  // ==========================================
  // SECTION 4: SIMULASI STUDI KASUS RIIL
  // ==========================================
  checkPageBreak(120)
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('4. Simulasi Studi Kasus Riil Nyata: Perbandingan Karyawan A vs Karyawan B')
  doc.moveDown(0.3)
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    'Untuk memahami secara jelas perbedaan Mode MANUAL dan Mode OTOMATIS, mari kita lihat contoh operasional riil dua orang karyawan di PT Santoso Makmur Jaya pada bulan Agustus:'
  )
  doc.moveDown(0.5)

  // Profil Table
  doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Profil 2 Karyawan:')
  const profileTableData = [
    ['Parameter Karyawan', 'Karyawan A (Budi - Staff Marketing)', 'Karyawan B (Siti - Staff Operasional)'],
    ['Gaji Pokok', 'Rp 6.000.000', 'Rp 6.000.000'],
    ['Status PTKP / Tanggungan', 'TK/0 (Lajang tanpa tanggungan)', 'K/1 (Menikah + 1 anak)'],
    ['Riwayat Absensi Bulan Ini', 'Hadir Penuh (0 Hari Alpha)', 'Bolos 2 Hari Tanpa Izin (2 Hari Alpha)']
  ]
  renderTable(doc, profileTableData, [150, 186, 187], margin)
  doc.moveDown(0.8)

  // Perbandingan Proses
  checkPageBreak(120)
  doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Perbandingan Proses Perhitungan Potongan (Manual vs Otomatis):')
  doc.moveDown(0.3)
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    '1. Potongan BPJS Kesehatan (MODE MANUAL — HRD Cuma Setting 1x di Master):\n' +
    '   • HRD sudah mengatur di Master Potongan: BPJS Kesehatan = 1%.\n' +
    '   • Hasil Karyawan A (Budi): 1% x Rp 6.000.000 = Rp 60.000\n' +
    '   • Hasil Karyawan B (Siti): 1% x Rp 6.000.000 = Rp 60.000\n' +
    '   • Penjelasan: HRD tidak perlu ngitung ulang. Sistem mengambil rumus patokan 1% yang di-setting HRD di master.\n\n' +
    '2. Potongan Alpha / Denda Bolos (MODE OTOMATIS — Dihitung Mesin dari Database Absensi):\n' +
    '   • HRD tidak mengisi angka apapun pada formulir potongan.\n' +
    '   • Hasil Karyawan A (Budi): Mesin membaca absensi Budi ➔ 0 Hari Alpha ➔ Potongan Alpha = Rp 0.\n' +
    '   • Hasil Karyawan B (Siti): Mesin membaca absensi Siti ➔ 2 Hari Alpha ➔ Potongan Alpha = 2 x (Rp 6.000.000 / 30) = Rp 400.000.\n' +
    '   • Penjelasan: HRD tidak perlu ngitung hari bolos Siti manual. Sistem membaca sendiri data absensi dan memotong otomatis.\n\n' +
    '3. Potongan Pajak PPh 21 (MODE OTOMATIS — Dihitung Mesin dari Data Profil PTKP):\n' +
    '   • HRD tidak pernah mengisi angka pajak di formulir.\n' +
    '   • Rincian Perhitungan Mesin Backend:\n' +
    '     - Karyawan A (Budi - TK/0): Gaji Bruto Rp 6.000.000 ➔ Biaya Jabatan Rp 300.000 ➔ Neto Tahunan Rp 68.400.000 ➔ PTKP Rp 54.000.000 ➔ PKP Rp 14.400.000 ➔ PPh 21 Tahunan Rp 720.000 ➔ Pajak Bulanan = Rp 60.000.\n' +
    '     - Karyawan B (Siti - K/1): Gaji Bruto Rp 6.000.000 ➔ Biaya Jabatan Rp 300.000 ➔ Neto Tahunan Rp 68.400.000 ➔ PTKP Rp 63.000.000 (54jt + 4.5jt + 4.5jt) ➔ PKP Rp 5.400.000 ➔ PPh 21 Tahunan Rp 270.000 ➔ Pajak Bulanan = Rp 22.500.\n' +
    '   • Kenapa Pajak Siti Lebih Kecil?: Karena Siti sudah menikah & punya 1 anak, negara memberikan Batas Bebas Pajak (PTKP) lebih besar (Rp 63 Juta) dibanding Budi yang lajang (Rp 54 Juta).',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(0.8)

  checkPageBreak(50)
  doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Bagaimana Jika Di Masa Depan Menambah Potongan Otomatis Baru?')
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    '• Mode Otomatis berarti potongan tersebut membutuhkan rumus / logika pemrograman khusus di kode backend yang membaca data aktivitas atau profil database tertentu.\n' +
    '• Jika kelak Anda ingin menambah fitur potongan otomatis baru (misal: Potongan Keterlambatan Per Menit), programmer akan menyiapkan rumus backend: Total Menit Telat x Rp 1.000, lalu HRD tinggal memilih Mode Otomatis di menu master.',
    { indent: 10, lineGap: 2 }
  )
  doc.moveDown(0.8)

  // Final Rekap Table
  checkPageBreak(120)
  doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Rekapitulasi Akhir Slip Gaji (Budi vs Siti):')
  const finalCaseData = [
    ['Komponen Penggajian', 'Karyawan A (Budi)', 'Karyawan B (Siti)', 'Keterangan Mode'],
    ['Gaji Pokok', 'Rp 6.000.000', 'Rp 6.000.000', 'Pokok Jabatan'],
    ['Potongan BPJS Kesehatan', '- Rp 60.000', '- Rp 60.000', 'MANUAL (Persentase 1% dari Master)'],
    ['Potongan Alpha (Bolos Kerja)', '- Rp 0', '- Rp 400.000', 'OTOMATIS (Mesin baca 2 hari alpha di Absensi)'],
    ['Potongan Pajak PPh 21', '- Rp 112.500', '- Rp 67.500', 'OTOMATIS (Mesin hitung PTKP TK/0 vs K/1)'],
    ['TOTAL DITRANSFER (TAKE HOME PAY)', 'Rp 5.827.500', 'Rp 5.472.500', 'Gaji Bersih Akhir']
  ]

  renderTable(doc, finalCaseData, [140, 115, 115, 153], margin)

  // Add Page Numbers Footer
  const totalPages = doc.bufferedPageRange().count
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i)
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(
      `PT SANTOSO MAKMUR JAYA — Halaman ${i + 1} dari ${totalPages}`,
      margin, 800, { align: 'center', width: pageWidth }
    )
  }

  doc.end()

  stream1.on('finish', () => {
    // Copy stream1 output to stream2
    fs.copyFileSync(pdfPath1, pdfPath2)
    console.log('REBUILD_SUCCESS_FULL_PDF')
  })
}

// Custom Helper Table Renderer with Auto Row Height & Wrap
function renderTable(doc, tableData, colWidths, startXMargin) {
  let startY = doc.y

  tableData.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0
    const isTotal = row[0].toLowerCase().includes('total ditransfer') || row[0].toLowerCase().includes('take home pay')

    // Compute required row height based on text content
    let maxContentHeight = 16
    row.forEach((cellText, colIndex) => {
      const fontSize = isHeader ? 8.5 : 8
      const fontName = isHeader || isTotal ? 'Helvetica-Bold' : 'Helvetica'
      doc.fontSize(fontSize).font(fontName)
      const textHeight = doc.heightOfString(cellText, { width: colWidths[colIndex] - 12 })
      if (textHeight + 10 > maxContentHeight) {
        maxContentHeight = textHeight + 10
      }
    })

    // Check page break
    if (startY + maxContentHeight > 760) {
      doc.addPage()
      startY = 36
    }

    // Draw Cell background & border
    if (isHeader) {
      doc.rect(startXMargin, startY, 523, maxContentHeight).fill('#0f172a')
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
    } else if (isTotal) {
      doc.rect(startXMargin, startY, 523, maxContentHeight).fill('#ecfdf5').stroke('#10b981')
      doc.fillColor('#047857').fontSize(8.5).font('Helvetica-Bold')
    } else {
      doc.rect(startXMargin, startY, 523, maxContentHeight).fill(rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0')
      doc.fillColor('#334155').fontSize(8).font('Helvetica')
    }

    // Draw Cell Text
    let currentX = startXMargin
    row.forEach((cellText, colIndex) => {
      doc.text(cellText, currentX + 6, startY + 5, {
        width: colWidths[colIndex] - 12,
        lineGap: 1.5,
      })
      currentX += colWidths[colIndex]
    })

    startY += maxContentHeight
  })

  doc.y = startY + 10
}

buildFullPdf()

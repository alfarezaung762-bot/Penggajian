import 'dotenv/config'
import prisma from '../lib/prisma'
import { role_account, gender_employee, status_pernikahan_employee, status_kepegawaian_employee, jenis_pengajuan, status_pengajuan, status_periode, aksi_log } from '../app/generated/prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const dbUrl = process.env.DATABASE_URL || ''
  const maskedHost = dbUrl.includes('@') ? dbUrl.split('@')[1] : 'unknown host'
  console.log(`🌱 Memulai Clean Reset & Seeding Data Dummy ke: [${maskedHost}]...`)

  // 0. Hapus Data Lama Berdasarkan Urutan Relasi Foreign Key
  await prisma.slip_gaji_detail.deleteMany()
  await prisma.slip_gaji.deleteMany()
  await prisma.periode_penggajian.deleteMany()
  await prisma.pengajuan.deleteMany()
  await prisma.absensi.deleteMany()
  await prisma.saldo_cuti.deleteMany()
  await prisma.tunjangan_lain.deleteMany()
  await prisma.jenis_potongan.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.hari_libur.deleteMany()
  await prisma.log_aktivitas.deleteMany()
  await prisma.account.deleteMany()
  await prisma.jabatan.deleteMany()

  console.log('🧹 Berhasil membersihkan seluruh tabel database.')

  // Password Hashes
  const defaultPasswordHash = await bcrypt.hash('password123', 10)
  const budiPasswordHash = await bcrypt.hash('budi123', 10)
  const hrdPasswordHash = await bcrypt.hash('hrd123', 10)
  const adminPasswordHash = await bcrypt.hash('admin123', 10)

  // 1. Seed Master Jabatan (6 Jabatan)
  console.log('💼 Seeding Master Jabatan...')
  const j1 = await prisma.jabatan.create({ data: { nama: 'Direktur Operasional', gaji_pokok: 15000000, tunjangan_jabatan: 5000000, uang_makan: 50000 } })
  const j2 = await prisma.jabatan.create({ data: { nama: 'Manager HRD & Finance', gaji_pokok: 10000000, tunjangan_jabatan: 3000000, uang_makan: 40000 } })
  const j3 = await prisma.jabatan.create({ data: { nama: 'Senior Software Engineer', gaji_pokok: 9000000, tunjangan_jabatan: 2000000, uang_makan: 35000 } })
  const j4 = await prisma.jabatan.create({ data: { nama: 'Staff Marketing & Sales', gaji_pokok: 6000000, tunjangan_jabatan: 1000000, uang_makan: 30000 } })
  const j5 = await prisma.jabatan.create({ data: { nama: 'Staff Administrasi & Akuntansi', gaji_pokok: 5500000, tunjangan_jabatan: 750000, uang_makan: 30000 } })
  const j6 = await prisma.jabatan.create({ data: { nama: 'Staff Operasional & Logistik', gaji_pokok: 5000000, tunjangan_jabatan: 500000, uang_makan: 25000 } })

  // 2. Seed Accounts Staff (2 Account: HRD & Admin Owner)
  console.log('🔐 Seeding Staff Accounts...')
  const accHrd = await prisma.account.create({
    data: {
      name: 'Manager HRD & Finance',
      username: 'hrd',
      password_hash: hrdPasswordHash,
      role: role_account.hrd,
    },
  })

  const accAdmin = await prisma.account.create({
    data: {
      name: 'Admin Owner',
      username: 'admin',
      password_hash: adminPasswordHash,
      role: role_account.admin_owner,
    },
  })

  // 3. Seed Master Hari Libur Nasional (4 Hari Libur Indonesia Juni - Agt 2026)
  console.log('📅 Seeding Master Hari Libur Nasional...')
  await prisma.hari_libur.createMany({
    data: [
      { tanggal: new Date('2026-06-01'), keterangan: 'Hari Lahir Pancasila', created_by: accAdmin.id },
      { tanggal: new Date('2026-06-17'), keterangan: 'Tahun Baru Islam 1448 Hijriah', created_by: accAdmin.id },
      { tanggal: new Date('2026-08-17'), keterangan: 'Hari Kemerdekaan Republik Indonesia (Proklamasi RI ke-81)', created_by: accAdmin.id },
      { tanggal: new Date('2026-08-26'), keterangan: 'Maulid Nabi Muhammad SAW', created_by: accAdmin.id },
    ],
  })

  // 4. Seed Data Karyawan (31 Karyawan: 1 Budi Demo + 30 Karyawan Baru)
  console.log('👥 Seeding 31 Karyawan...')

  const empDataList = [
    // Account 1: Budi Demo
    { nik: '3171010106260000', name: 'Budi Software Engineer', username: 'budi', password: budiPasswordHash, jId: j3.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.tetap, rek: '1112223334' },
    
    // 30 Karyawan Baru
    { nik: '3171010106260001', name: 'Budi Santoso', username: 'budi_santoso', password: defaultPasswordHash, jId: j1.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 2, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000001' },
    { nik: '3171010106260002', name: 'Siti Aminah', username: 'siti_aminah', password: defaultPasswordHash, jId: j2.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.K, tanggungan: 1, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000002' },
    { nik: '3171010106260003', name: 'Ahmad Fauzi', username: 'ahmad_fauzi', password: defaultPasswordHash, jId: j3.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000003' },
    { nik: '3171010106260004', name: 'Dewi Lestari', username: 'dewi_lestari', password: defaultPasswordHash, jId: j3.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.K, tanggungan: 0, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000004' },
    { nik: '3171010106260005', name: 'Rizky Pratama', username: 'rizky_pratama', password: defaultPasswordHash, jId: j4.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000005' },
    { nik: '3171010106260006', name: 'Maya Indah', username: 'maya_indah', password: defaultPasswordHash, jId: j4.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 1, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000006' },
    { nik: '3171010106260007', name: 'Eko Prasetyo', username: 'eko_prasetyo', password: defaultPasswordHash, jId: j5.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 3, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000007' },
    { nik: '3171010106260008', name: 'Rina Wijaya', username: 'rina_wijaya', password: defaultPasswordHash, jId: j5.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000008' },
    { nik: '3171010106260009', name: 'Hendra Gunawan', username: 'hendra_gunawan', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 1, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000009' },
    { nik: '3171010106260010', name: 'Dian Sastro', username: 'dian_sastro', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000010' },
    { nik: '3171010106260011', name: 'Agus Setiawan', username: 'agus_setiawan', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 2, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000011' },
    { nik: '3171010106260012', name: 'Fitriani', username: 'fitriani', password: defaultPasswordHash, jId: j4.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000012' },
    { nik: '3171010106260013', name: 'Bambang Pamungkas', username: 'bambang_p', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 3, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000013' },
    { nik: '3171010106260014', name: 'Nabila Putri', username: 'nabila_putri', password: defaultPasswordHash, jId: j5.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000014' },
    { nik: '3171010106260015', name: 'Doni Kurniawan', username: 'doni_kurniawan', password: defaultPasswordHash, jId: j3.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 1, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000015' },
    { nik: '3171010106260016', name: 'Melati Sukma', username: 'melati_sukma', password: defaultPasswordHash, jId: j4.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 2, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000016' },
    { nik: '3171010106260017', name: 'Fajar Ramadhan', username: 'fajar_ramadhan', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000017' },
    { nik: '3171010106260018', name: 'Indah Permata', username: 'indah_permata', password: defaultPasswordHash, jId: j5.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.K, tanggungan: 0, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000018' },
    { nik: '3171010106260019', name: 'Gilang Dirga', username: 'gilang_dirga', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 1, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000019' },
    { nik: '3171010106260020', name: 'Hani Safitri', username: 'hani_safitri', password: defaultPasswordHash, jId: j4.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000020' },
    { nik: '3171010106260021', name: 'Irfan Hakim', username: 'irfan_hakim', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 2, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000021' },
    { nik: '3171010106260022', name: 'Julia Perez', username: 'julia_perez', password: defaultPasswordHash, jId: j5.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 1, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000022' },
    { nik: '3171010106260023', name: 'Kevin Sanjaya', username: 'kevin_sanjaya', password: defaultPasswordHash, jId: j3.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000023' },
    { nik: '3171010106260024', name: 'Larasati', username: 'larasati', password: defaultPasswordHash, jId: j4.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.K, tanggungan: 1, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000024' },
    { nik: '3171010106260025', name: 'Muhammad Ali', username: 'muhammad_ali', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 3, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000025' },
    { nik: '3171010106260026', name: 'Nina Zatulini', username: 'nina_zatulini', password: defaultPasswordHash, jId: j5.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000026' },
    { nik: '3171010106260027', name: 'Oscar Lawalata', username: 'oscar_lawalata', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000027' },
    { nik: '3171010106260028', name: 'Putri Titian', username: 'putri_titian', password: defaultPasswordHash, jId: j4.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.K, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000028' },
    { nik: '3171010106260029', name: 'Qory Sandioriva', username: 'qory_s', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.P, ptkp: status_pernikahan_employee.TK, tanggungan: 0, statusPeg: status_kepegawaian_employee.kontrak, rek: '1000000029' },
    { nik: '3171010106260030', name: 'Rian D\'Masiv', username: 'rian_dmasiv', password: defaultPasswordHash, jId: j6.id, gender: gender_employee.L, ptkp: status_pernikahan_employee.K, tanggungan: 1, statusPeg: status_kepegawaian_employee.tetap, rek: '1000000030' },
  ]

  const employeesCreated = []
  let empIdx = 1
  for (const item of empDataList) {
    const portraitGender = item.gender === gender_employee.L ? 'men' : 'women'
    const photoNum = (empIdx % 50) + 1
    const realPhotoUrl = `https://randomuser.me/api/portraits/${portraitGender}/${photoNum}.jpg`
    empIdx++

    const emp = await prisma.employee.create({
      data: {
        nik: item.nik,
        name: item.name,
        username: item.username,
        password_hash: item.password,
        jabatan_id: item.jId,
        gender: item.gender,
        join_date: new Date('2026-06-01'),
        status_pernikahan: item.ptkp,
        jumlah_tanggungan: item.tanggungan,
        status_kepegawaian: item.statusPeg,
        durasi_kontrak_bulan: item.statusPeg === status_kepegawaian_employee.kontrak ? 12 : null,
        bank_account_number: item.rek,
        photo_url: realPhotoUrl,
      },
    })
    employeesCreated.push(emp)

    // Seed Saldo Cuti (12 Hari untuk setiap karyawan)
    await prisma.saldo_cuti.create({
      data: {
        employee_id: emp.id,
        tahun: 2026,
        kuota: 12,
        terpakai: 0,
      },
    })
  }

  // 5. Seed Master Tunjangan Lainnya
  console.log('🎁 Seeding Master Tunjangan Lainnya...')
  await prisma.tunjangan_lain.createMany({
    data: [
      { nama: 'Tunjangan Transportasi Lapangan', nominal: 750000, tanggal_pencairan: new Date('2026-06-15') },
      { nama: 'Bonus Kinerja Kuartal II', nominal: 1500000, tanggal_pencairan: new Date('2026-06-20'), jabatan_id: j3.id },
      { nama: 'Tunjangan Komunikasi & Pulsa', nominal: 250000, tanggal_pencairan: new Date('2026-06-25') },
    ],
  })

  // 6. Seed Master Jenis Potongan
  console.log('✂️ Seeding Master Jenis Potongan Gaji...')
  await prisma.jenis_potongan.createMany({
    data: [
      { nama: 'BPJS Kesehatan', mode_hitung: 'manual', kategori: 'bpjs', nilai_default: 1.0, tipe_nilai: 'persen', status_aktif: true },
      { nama: 'BPJS Ketenagakerjaan (JHT)', mode_hitung: 'manual', kategori: 'bpjs', nilai_default: 2.0, tipe_nilai: 'persen', status_aktif: true },
      { nama: 'BPJS Jaminan Pensiun (JP)', mode_hitung: 'manual', kategori: 'bpjs', nilai_default: 1.0, tipe_nilai: 'persen', status_aktif: true },
      { nama: 'Potongan PPh 21 Pajak (Pasal 21 HPP)', mode_hitung: 'otomatis', kategori: 'pajak', tipe_nilai: 'nominal', status_aktif: true },
      { nama: 'Denda Keterlambatan / Alpha Absensi', mode_hitung: 'otomatis', kategori: 'kehadiran', tipe_nilai: 'nominal', status_aktif: true },
    ],
  })

  // Helper untuk generate tanggal kerja (Senin - Jumat)
  function getWorkdays(startDateStr: string, endDateStr: string): string[] {
    const dates: string[] = []
    const curr = new Date(startDateStr)
    const end = new Date(endDateStr)
    while (curr <= end) {
      const day = curr.getDay()
      if (day !== 0 && day !== 6) { // Bukan Sabtu & Minggu
        dates.push(curr.toISOString().split('T')[0])
      }
      curr.setDate(curr.getDate() + 1)
    }
    return dates
  }

  // 7. Seed Absensi & Pengajuan untuk 31 Karyawan (Juni, Juli, Agustus 2026)
  console.log('⏰ Seeding Riwayat Absensi & Pengajuan Multi-Bulan (Juni - Agt 2026)...')

  const workdaysJuni = getWorkdays('2026-06-01', '2026-06-25') // 19 hari kerja (Cutoff 25 Juni)
  const workdaysJuli = getWorkdays('2026-06-26', '2026-07-25') // 22 hari kerja (Cutoff 25 Juli)
  const workdaysAgustus = getWorkdays('2026-07-26', '2026-08-02') // 5 hari kerja (s/d 2 Agustus)

  const allWorkdays = [...workdaysJuni, ...workdaysJuli, ...workdaysAgustus]

  // Kelompok Skenario Alpha (Karyawan #9, #17, #19, #27, #29)
  const alphaEmpUsernames = ['hendra_gunawan', 'fajar_ramadhan', 'gilang_dirga', 'oscar_lawalata', 'qory_s']
  // Kelompok Skenario Lembur (Karyawan #4, #5, #11, #13, #21, #25)
  const lemburEmpUsernames = ['dewi_lestari', 'rizky_pratama', 'agus_setiawan', 'bambang_p', 'irfan_hakim', 'muhammad_ali']
  // Kelompok Skenario Cuti (Karyawan #6, #10, #12, #18, #22, #26)
  const cutiEmpUsernames = ['maya_indah', 'dian_sastro', 'fitriani', 'indah_permata', 'julia_perez', 'nina_zatulini']
  // Kelompok Skenario Telat (Karyawan #16, #20, #24, #28, #30)
  const telatEmpUsernames = ['melati_sukma', 'hani_safitri', 'larasati', 'putri_titian', 'rian_dmasiv']

  for (const emp of employeesCreated) {
    const isAlphaEmp = alphaEmpUsernames.includes(emp.username)
    const isLemburEmp = lemburEmpUsernames.includes(emp.username)
    const isCutiEmp = cutiEmpUsernames.includes(emp.username)
    const isTelatEmp = telatEmpUsernames.includes(emp.username)

    // Seed Cuti & Lembur Pengajuan jika masuk kelompok Skenario
    if (isCutiEmp) {
      await prisma.pengajuan.create({
        data: {
          employee_id: emp.id,
          jenis: jenis_pengajuan.cuti,
          tanggal_mulai_cuti: new Date('2026-06-10'),
          tanggal_selesai_cuti: new Date('2026-06-11'),
          alasan_cuti: 'Pengajuan Cuti Tahunan Keluarga',
          status: status_pengajuan.disetujui,
          diproses_oleh: accHrd.id,
        },
      })
    }

    if (isLemburEmp) {
      await prisma.pengajuan.create({
        data: {
          employee_id: emp.id,
          jenis: jenis_pengajuan.lembur,
          tanggal_lembur: new Date('2026-06-20'),
          total_menit_lembur: 240,
          status: status_pengajuan.disetujui,
          diproses_oleh: accHrd.id,
        },
      })
    }

    // Seed Absensi Harian
    for (let idx = 0; idx < allWorkdays.length; idx++) {
      const dateStr = allWorkdays[idx]
      const currDate = new Date(dateStr)

      // Skip jika tanggal libur nasional
      if (dateStr === '2026-06-01' || dateStr === '2026-06-17') continue

      // Cuti 10-11 Juni
      if (isCutiEmp && (dateStr === '2026-06-10' || dateStr === '2026-06-11')) {
        await prisma.absensi.create({
          data: {
            employee_id: emp.id,
            tanggal: currDate,
            jam_masuk: new Date(`${dateStr}T08:00:00.000Z`),
            jam_pulang: new Date(`${dateStr}T17:00:00.000Z`),
            status: 'cuti',
            catatan_alasan: 'Cuti Tahunan Disetujui',
          },
        })
        continue
      }

      // Alpha pada tanggal tertentu bagi karyawan kelompok Alpha
      if (isAlphaEmp && (idx === 3 || idx === 8)) { // Tanggal ke-4 & ke-9
        await prisma.absensi.create({
          data: {
            employee_id: emp.id,
            tanggal: currDate,
            status: 'alpha',
            catatan_alasan: 'Tidak Hadir Tanpa Keterangan',
          },
        })
        continue
      }

      // Karyawan Telat
      const jamMasukStr = isTelatEmp && (idx % 2 === 0) ? `${dateStr}T08:25:00.000Z` : `${dateStr}T07:55:00.000Z`
      const jamKeluarStr = `${dateStr}T17:05:00.000Z`
      const statusAbsensi = isTelatEmp && (idx % 2 === 0) ? 'telat' : 'hadir'
      const jamLembur = isLemburEmp && (idx % 3 === 0) ? 2 : 0

      await prisma.absensi.create({
        data: {
          employee_id: emp.id,
          tanggal: currDate,
          jam_masuk: new Date(jamMasukStr),
          jam_pulang: new Date(jamKeluarStr),
          status: statusAbsensi,
          foto_masuk_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.username}`,
          foto_pulang_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.username}`,
        },
      })
    }
  }

  // 8. Seed 3 Periode Penggajian & Generate Slips
  console.log('💵 Seeding 3 Periode Penggajian & Mengkalkulasi Slip Gaji...')

  // Periode 1: Juni 2026 (Terkunci)
  const periodeJuni = await prisma.periode_penggajian.create({
    data: {
      bulan: 6,
      tahun: 2026,
      status: status_periode.terkunci,
      dikunci_oleh: accAdmin.id,
      dikunci_pada: new Date('2026-06-30T17:00:00.000Z'),
    },
  })

  // Periode 2: Juli 2026 (Terkunci)
  const periodeJuli = await prisma.periode_penggajian.create({
    data: {
      bulan: 7,
      tahun: 2026,
      status: status_periode.terkunci,
      dikunci_oleh: accAdmin.id,
      dikunci_pada: new Date('2026-07-31T17:00:00.000Z'),
    },
  })

  // Periode 3: Agustus 2026 (Draft)
  await prisma.periode_penggajian.create({
    data: {
      bulan: 8,
      tahun: 2026,
      status: status_periode.draft,
    },
  })

  // Hitung & Buat Slip Gaji untuk Periode Juni & Juli
  const { processPayrollPeriode } = await import('../lib/services/payroll-service')
  await processPayrollPeriode({ bulan: 6, tahun: 2026, accountId: accAdmin.id })
  await processPayrollPeriode({ bulan: 7, tahun: 2026, accountId: accAdmin.id })

  // 9. Seed Audit Log Aktivitas
  console.log('📜 Seeding Audit Log Aktivitas Historis...')
  await prisma.log_aktivitas.createMany({
    data: [
      { account_id: accAdmin.id, aksi: aksi_log.buat, tabel_target: 'employee', id_target: 1, nilai_baru: { info: 'Mendaftarkan 30 Karyawan Baru pada tanggal 01 Juni 2026' } },
      { account_id: accHrd.id, aksi: aksi_log.buat, tabel_target: 'tunjangan_lain', id_target: 1, nilai_baru: { info: 'Menambahkan Master Tunjangan Komunikasi & Transportasi' } },
      { account_id: accAdmin.id, aksi: aksi_log.buat, tabel_target: 'hari_libur', id_target: 1, nilai_baru: { info: 'Mendaftarkan Kalender Hari Libur Nasional 2026' } },
      { account_id: accHrd.id, aksi: aksi_log.setujui, tabel_target: 'pengajuan', id_target: 1, nilai_baru: { info: 'Menyetujui Pengajuan Cuti & Lembur Karyawan Juni 2026' } },
      { account_id: accAdmin.id, aksi: aksi_log.kunci, tabel_target: 'periode_penggajian', id_target: periodeJuni.id, nilai_baru: { status: 'terkunci' } },
      { account_id: accAdmin.id, aksi: aksi_log.kunci, tabel_target: 'periode_penggajian', id_target: periodeJuli.id, nilai_baru: { status: 'terkunci' } },
    ],
  })

  console.log('✅ SEEDING SELESAI DENGAN SUKSES!')
  console.log('----------------------------------------------------')
  console.log('🔑 Akun Demo Siap Digunakan:')
  console.log('1. Employee Demo  : username "budi"           | password "budi123"')
  console.log('2. Staf HRD       : username "hrd"            | password "hrd123"')
  console.log('3. Admin Owner    : username "admin"          | password "admin123"')
  console.log('4. 30 Karyawan    : username "budi_santoso", "siti_aminah", dll | password "password123"')
  console.log('----------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

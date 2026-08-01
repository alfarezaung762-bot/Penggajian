/**
 * Service Utama Orchestrator Kalkulasi Payroll
 * Mengacu pada Bagian 8.7 Dokumen Alur Sistem
 */

import prisma from '@/lib/prisma'
import { hitungPPh21Bulanan } from './pph21-service'
import { hitungLemburPeriode } from './lembur-service'
import { hitungAbsensiDanPotonganPeriode } from './absensi-service'

export interface GeneratePayrollParams {
  bulan: number // 1 - 12
  tahun: number // e.g. 2026
  accountId: number // Siapa HRD/Admin yang memproses
}

export async function processPayrollPeriode(params: GeneratePayrollParams) {
  const { bulan, tahun } = params

  const startDate = new Date(tahun, bulan - 1, 1)
  const endDate = new Date(tahun, bulan, 0) // Hari terakhir di bulan tersebut

  // 1. Buat / Dapatkan Record Periode Penggajian
  const periode = await prisma.periode_penggajian.upsert({
    where: {
      bulan_tahun: { bulan, tahun },
    },
    create: {
      bulan,
      tahun,
      status: 'draft',
    },
    update: {},
  })

  // 2. Ambil Semua Karyawan Aktif
  const employees = await prisma.employee.findMany({
    where: { is_active: true },
    include: { jabatan: true },
  })

  for (const emp of employees) {
    if (!emp.jabatan) continue

    const gajiPokok = Number(emp.jabatan.gaji_pokok ?? 0)
    const tunjanganJabatan = Number(emp.jabatan.tunjangan_jabatan ?? 0)
    const uangMakan = Number(emp.jabatan.uang_makan ?? 0)

    // a. Kalkulasi Lembur
    const lemburRes = await hitungLemburPeriode(emp.id, startDate, endDate, gajiPokok)

    // b. Kalkulasi Absensi & Potongan Alpha
    const absensiRes = await hitungAbsensiDanPotonganPeriode(emp.id, startDate, endDate, gajiPokok)

    // c. Kalkulasi Tunjangan Lainnya (Pencairan bulan ini)
    const listTunjanganLain = await prisma.tunjangan_lain.findMany({
      where: {
        tanggal_pencairan: { gte: startDate, lte: endDate },
        OR: [
          { jabatan_id: null },
          { jabatan_id: emp.jabatan_id },
        ],
      },
    })
    const totalTunjanganLain = listTunjanganLain.reduce((sum, t) => sum + Number(t.nominal), 0)

    // d. Kalkulasi Potongan Tetap / BPJS dari Master Potongan
    const listPotongan = await prisma.jenis_potongan.findMany({
      where: { status_aktif: true },
    })

    let totalPotonganBPJS = 0
    let totalPotonganLain = 0

    for (const p of listPotongan) {
      const val = Number(p.nilai_default ?? 0)
      if (p.kategori === 'bpjs') {
        const nom = p.tipe_nilai === 'nominal' ? val : (gajiPokok * (val / 100))
        totalPotonganBPJS += nom
      } else if (p.kategori === 'kustom') {
        const nom = p.tipe_nilai === 'nominal' ? val : (gajiPokok * (val / 100))
        totalPotonganLain += nom
      }
    }

    // e. Total Gaji Kotor
    const totalGajiKotor = gajiPokok + tunjanganJabatan + uangMakan + lemburRes.totalNominalLembur + totalTunjanganLain

    // f. Kalkulasi PPh 21
    const pph21 = hitungPPh21Bulanan({
      gajiBrutoBulanan: totalGajiKotor,
      statusPernikahan: emp.status_pernikahan || 'TK',
      jumlahTanggungan: emp.jumlah_tanggungan || 0,
    })

    // g. Total Potongan
    const totalPotongan = totalPotonganBPJS + pph21 + absensiRes.totalPotonganAlpha + totalPotonganLain

    // h. Gaji Bersih (Take Home Pay)
    const gajiBersih = Math.max(0, totalGajiKotor - totalPotongan)

    // i. Simpan / Perbarui Slip Gaji
    const existingSlip = await prisma.slip_gaji.findFirst({
      where: {
        periode_penggajian_id: periode.id,
        employee_id: emp.id,
      },
    })

    let slipGaji
    if (existingSlip) {
      slipGaji = await prisma.slip_gaji.update({
        where: { id: existingSlip.id },
        data: {
          gaji_pokok: gajiPokok,
          tunjangan_jabatan: tunjanganJabatan,
          uang_makan: uangMakan,
          total_lembur: lemburRes.totalNominalLembur,
          total_potongan: totalPotongan,
          gaji_bersih: gajiBersih,
        },
      })
    } else {
      slipGaji = await prisma.slip_gaji.create({
        data: {
          periode_penggajian_id: periode.id,
          employee_id: emp.id,
          gaji_pokok: gajiPokok,
          tunjangan_jabatan: tunjanganJabatan,
          uang_makan: uangMakan,
          total_lembur: lemburRes.totalNominalLembur,
          total_potongan: totalPotongan,
          gaji_bersih: gajiBersih,
        },
      })
    }

    // j. Simpan Detail Komponen Slip Gaji
    await prisma.slip_gaji_detail.deleteMany({
      where: { slip_gaji_id: slipGaji.id },
    })

    await prisma.slip_gaji_detail.createMany({
      data: [
        { slip_gaji_id: slipGaji.id, tipe: 'tambahan', nama_komponen: 'Gaji Pokok', nominal: gajiPokok },
        { slip_gaji_id: slipGaji.id, tipe: 'tambahan', nama_komponen: 'Tunjangan Jabatan', nominal: tunjanganJabatan },
        { slip_gaji_id: slipGaji.id, tipe: 'tambahan', nama_komponen: 'Uang Makan', nominal: uangMakan },
        { slip_gaji_id: slipGaji.id, tipe: 'tambahan', nama_komponen: 'Upah Lembur', nominal: lemburRes.totalNominalLembur },
        { slip_gaji_id: slipGaji.id, tipe: 'tambahan', nama_komponen: 'Tunjangan Lainnya', nominal: totalTunjanganLain },
        { slip_gaji_id: slipGaji.id, tipe: 'potongan', nama_komponen: 'Potongan BPJS', nominal: totalPotonganBPJS },
        { slip_gaji_id: slipGaji.id, tipe: 'potongan', nama_komponen: 'PPh 21', nominal: pph21 },
        { slip_gaji_id: slipGaji.id, tipe: 'potongan', nama_komponen: 'Potongan Alpha', nominal: absensiRes.totalPotonganAlpha },
        { slip_gaji_id: slipGaji.id, tipe: 'potongan', nama_komponen: 'Potongan Lainnya', nominal: totalPotonganLain },
      ],
    })
  }

  return periode
}

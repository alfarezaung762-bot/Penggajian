/**
 * Service Kalkulasi Presensi & Potongan Alpha
 * Mengacu pada Bagian 2.3.1 Dokumen Alur Sistem
 */

import prisma from '@/lib/prisma'

export interface HitungAbsensiResult {
  totalHadir: number
  totalTelat: number
  totalAlpha: number
  totalSakit: number
  totalCuti: number
  totalPotonganAlpha: number
}

export async function hitungAbsensiDanPotonganPeriode(
  employeeId: number,
  startDate: Date,
  endDate: Date,
  gajiPokok: number
): Promise<HitungAbsensiResult> {
  const listAbsensi = await prisma.absensi.findMany({
    where: {
      employee_id: employeeId,
      tanggal: { gte: startDate, lte: endDate },
    },
  })

  let totalHadir = 0
  let totalTelat = 0
  let totalAlpha = 0

  for (const a of listAbsensi) {
    if (a.status === 'hadir') totalHadir++
    else if (a.status === 'telat') totalTelat++
    else if (a.status === 'alpha') totalAlpha++
  }

  // Hitung Pengajuan Sakit / Cuti yang Disetujui
  const listPengajuan = await prisma.pengajuan.findMany({
    where: {
      employee_id: employeeId,
      status: 'disetujui',
      OR: [
        { tanggal_mulai_cuti: { gte: startDate, lte: endDate } },
        { tanggal_sakit: { gte: startDate, lte: endDate } },
      ],
    },
  })

  let totalSakit = 0
  let totalCuti = 0

  for (const p of listPengajuan) {
    if (p.jenis === 'sakit') totalSakit++
    else if (p.jenis === 'cuti') {
      const start = p.tanggal_mulai_cuti ? new Date(p.tanggal_mulai_cuti) : new Date()
      const end = p.tanggal_selesai_cuti ? new Date(p.tanggal_selesai_cuti) : start
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      totalCuti += diffDays
    }
  }

  // Cek Potongan Alpha dari Master Jenis Potongan
  const potonganAlphaConfig = await prisma.jenis_potongan.findFirst({
    where: { nama: { contains: 'Alpha', mode: 'insensitive' }, status_aktif: true },
  })

  let totalPotonganAlpha = 0
  const nilaiDef = Number(potonganAlphaConfig?.nilai_default ?? 0)

  if (totalAlpha > 0) {
    if (potonganAlphaConfig && nilaiDef > 0) {
      if (potonganAlphaConfig.tipe_nilai === 'nominal') {
        totalPotonganAlpha = totalAlpha * nilaiDef
      } else {
        // Persentase dari Gaji Pokok per hari (asumsi 1/25 gaji harian)
        const gajiHarian = gajiPokok / 25
        totalPotonganAlpha = totalAlpha * (gajiHarian * (nilaiDef / 100))
      }
    } else {
      // Default: Potongan 1/25 Gaji Pokok per Hari Alpha jika tidak ada aturan khusus
      const gajiHarian = gajiPokok / 25
      totalPotonganAlpha = totalAlpha * gajiHarian
    }
  }

  return {
    totalHadir,
    totalTelat,
    totalAlpha,
    totalSakit,
    totalCuti,
    totalPotonganAlpha: Math.round(totalPotonganAlpha),
  }
}

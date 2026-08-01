/**
 * Service Kalkulasi Lembur Karyawan
 * Mengacu pada Bagian 2.3, Poin 77 Dokumen Alur Sistem
 */

import prisma from '@/lib/prisma'

export interface HitungLemburResult {
  totalMenitLembur: number
  totalNominalLembur: number
}

const HARI_MAP: Record<number, string> = {
  0: 'minggu', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu',
}

export async function hitungLemburPeriode(
  employeeId: number,
  startDate: Date,
  endDate: Date,
  gajiPokok: number
): Promise<HitungLemburResult> {
  // Ambil pengajuan lembur yang disetujui pada rentang tanggal
  const pengajuanLembur = await prisma.pengajuan.findMany({
    where: {
      employee_id: employeeId,
      jenis: 'lembur',
      status: 'disetujui',
      tanggal_lembur: { gte: startDate, lte: endDate },
    },
  })

  if (pengajuanLembur.length === 0) {
    return { totalMenitLembur: 0, totalNominalLembur: 0 }
  }

  // Ambil tarif lembur multiplier
  const tarifLemburList = await prisma.tarif_lembur.findMany()

  const tarifHariKerja = Number(tarifLemburList.find(t => t.tipe_hari === 'kerja')?.multiplier ?? 1.5)
  const tarifHariLibur = Number(tarifLemburList.find(t => t.tipe_hari === 'libur')?.multiplier ?? 2.0)

  // Upah per jam dasar (1 / 173 * Gaji Pokok)
  const upahPerJam = gajiPokok / 173

  let totalMenit = 0
  let totalNominal = 0

  for (const lembur of pengajuanLembur) {
    const menit = lembur.total_menit_lembur ?? 0
    totalMenit += menit

    // Cek apakah tanggal lembur adalah hari libur nasional atau libur akhir pekan
    const tgl = lembur.tanggal_lembur ? new Date(lembur.tanggal_lembur) : new Date()
    tgl.setHours(0, 0, 0, 0)

    const isLiburNasional = await prisma.hari_libur.findFirst({
      where: { tanggal: tgl },
    })

    const hariName = HARI_MAP[tgl.getDay()]
    const jadwalHari = await prisma.jadwal_kerja.findFirst({
      where: { hari: hariName as 'senin' },
    })

    const isLibur = !!isLiburNasional || !jadwalHari || !jadwalHari.jam_masuk
    const multiplier = isLibur ? tarifHariLibur : tarifHariKerja

    const jamLembur = menit / 60
    const nominal = jamLembur * upahPerJam * multiplier
    totalNominal += Math.round(nominal)
  }

  return {
    totalMenitLembur: totalMenit,
    totalNominalLembur: totalNominal,
  }
}

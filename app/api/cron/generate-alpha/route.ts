import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

const HARI_MAP: Record<number, string> = {
  0: 'minggu', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu',
}

// GET — dipanggil oleh cron setiap jam, generate alpha untuk karyawan yang tidak absen
export async function GET() {
  try {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

    // Cek hari libur
    const isLibur = await prisma.hari_libur.findFirst({ where: { tanggal: today } })
    if (isLibur) return successResponse({ message: 'Hari libur, skip alpha generation' })

    // Cek jadwal kerja hari ini
    const hariIni = HARI_MAP[now.getDay()]
    const jadwal = await prisma.jadwal_kerja.findFirst({
      where: { hari: hariIni as 'senin' },
    })

    if (!jadwal || !jadwal.jam_masuk) {
      return successResponse({ message: 'Tidak ada jadwal masuk hari ini, skip' })
    }

    // Hanya jalankan setelah batas toleransi telat berlalu
    const jamMasuk = new Date(jadwal.jam_masuk)
    const batasTelat = new Date(now)
    batasTelat.setHours(jamMasuk.getUTCHours(), jamMasuk.getUTCMinutes() + jadwal.toleransi_telat_menit, 0, 0)

    if (now <= batasTelat) {
      return successResponse({ message: 'Belum melewati batas toleransi, skip' })
    }

    // Ambil semua karyawan aktif
    const employees = await prisma.employee.findMany({
      where: { is_active: true },
      select: { id: true },
    })

    let alphaCount = 0

    for (const emp of employees) {
      // Cek apakah sudah ada record absensi hari ini
      const existing = await prisma.absensi.findFirst({
        where: { employee_id: emp.id, tanggal: today },
      })

      if (!existing) {
        // Belum ada record sama sekali = alpha
        await prisma.absensi.create({
          data: {
            employee_id: emp.id,
            tanggal: today,
            status: 'alpha',
          },
        })
        alphaCount++
      }
    }

    return successResponse({ message: `Alpha generated for ${alphaCount} employees`, count: alphaCount })
  } catch (error) {
    console.error('Generate alpha error:', error)
    return errorResponse('Gagal generate alpha', 500)
  }
}

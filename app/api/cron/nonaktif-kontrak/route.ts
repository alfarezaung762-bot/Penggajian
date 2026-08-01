import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

// GET — cron auto nonaktifkan karyawan kontrak yang sudah lewat tanggal nonaktif
export async function GET() {
  try {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const result = await prisma.employee.updateMany({
      where: {
        status_kepegawaian: 'kontrak',
        is_active: true,
        tanggal_nonaktif_otomatis: { lte: now },
      },
      data: { is_active: false },
    })

    return successResponse({ message: `${result.count} kontrak karyawan dinonaktifkan`, count: result.count })
  } catch (error) {
    console.error('Auto nonaktif error:', error)
    return errorResponse('Gagal auto-nonaktifkan kontrak', 500)
  }
}

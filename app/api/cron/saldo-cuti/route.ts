import prisma from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

const KUOTA_CUTI_DEFAULT = 12

// GET — dipanggil cron awal tahun, generate saldo cuti untuk semua karyawan aktif
export async function GET() {
  try {
    const currentYear = new Date().getFullYear()

    const employees = await prisma.employee.findMany({
      where: { is_active: true },
      select: { id: true },
    })

    let created = 0

    for (const emp of employees) {
      const existing = await prisma.saldo_cuti.findFirst({
        where: { employee_id: emp.id, tahun: currentYear },
      })

      if (!existing) {
        await prisma.saldo_cuti.create({
          data: {
            employee_id: emp.id,
            tahun: currentYear,
            kuota: KUOTA_CUTI_DEFAULT,
            terpakai: 0,
          },
        })
        created++
      }
    }

    return successResponse({ message: `Saldo cuti ${currentYear} created for ${created} employees`, count: created })
  } catch (error) {
    console.error('Generate saldo cuti error:', error)
    return errorResponse('Gagal generate saldo cuti', 500)
  }
}

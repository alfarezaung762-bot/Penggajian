import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// PATCH — lock/finalisasi payroll bulan tertentu
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  try {
    const body = await request.json()
    const { bulan, tahun } = body
    if (!bulan || !tahun) return errorResponse('Bulan dan tahun wajib diisi')

    const period = await prisma.periode_penggajian.findUnique({
      where: {
        bulan_tahun: {
          bulan,
          tahun,
        },
      },
    })

    if (!period || period.status === 'terkunci') {
      return errorResponse('Tidak ada payroll draft untuk dikunci atau payroll sudah terkunci')
    }

    const updatedPeriod = await prisma.periode_penggajian.update({
      where: { id: period.id },
      data: {
        status: 'terkunci',
        dikunci_oleh: session.id,
        dikunci_pada: new Date(),
      },
      include: {
        slip_gaji: true,
      },
    })

    await catatLog({
      accountId: session.id,
      aksi: 'kunci',
      tabelTarget: 'payroll',
      idTarget: period.id,
      nilaiBaru: { bulan, tahun, jumlah: updatedPeriod.slip_gaji.length },
    })

    return successResponse({ message: `${updatedPeriod.slip_gaji.length} payroll berhasil dikunci` })
  } catch (error) {
    console.error('Lock payroll error:', error)
    return errorResponse('Gagal mengunci payroll', 500)
  }
}

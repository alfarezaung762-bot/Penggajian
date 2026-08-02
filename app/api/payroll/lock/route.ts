import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// PATCH — lock/unlock payroll bulan tertentu (Admin/Owner)
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse('Hanya Admin/Owner yang berhak mengubah status penguncian payroll')

  try {
    const body = await request.json()
    const { bulan, tahun, action } = body
    if (!bulan || !tahun) return errorResponse('Bulan dan tahun wajib diisi')

    const period = await prisma.periode_penggajian.findUnique({
      where: {
        bulan_tahun: {
          bulan,
          tahun,
        },
      },
    })

    if (!period) {
      return errorResponse('Periode penggajian belum dikalkulasi', 404)
    }

    // Tentukan status baru (Lock vs Unlock)
    const isUnlocking = action === 'unlock' || (period.status === 'terkunci' && action !== 'lock')
    const newStatus = isUnlocking ? 'draft' : 'terkunci'

    const updatedPeriod = await prisma.periode_penggajian.update({
      where: { id: period.id },
      data: {
        status: newStatus,
        dikunci_oleh: isUnlocking ? null : session.id,
        dikunci_pada: isUnlocking ? null : new Date(),
      },
      include: {
        slip_gaji: true,
      },
    })

    await catatLog({
      accountId: session.id,
      aksi: isUnlocking ? 'buka_kunci' : 'kunci',
      tabelTarget: 'payroll',
      idTarget: period.id,
      nilaiBaru: { bulan, tahun, status: newStatus, jumlah: updatedPeriod.slip_gaji.length },
    })

    const msg = isUnlocking
      ? `Payroll ${bulan}-${tahun} berhasil dibuka kuncinya (kembali ke DRAFT)`
      : `Payroll ${bulan}-${tahun} berhasil dikunci final`

    return successResponse({ message: msg, is_locked: newStatus === 'terkunci' })
  } catch (error) {
    console.error('Lock/Unlock payroll error:', error)
    return errorResponse('Gagal merubah status penguncian payroll', 500)
  }
}

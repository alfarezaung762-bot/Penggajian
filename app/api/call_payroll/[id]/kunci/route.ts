import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// PATCH — Lock/Kunci final periode penggajian (Admin/Owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse('Hanya Admin/Owner yang berhak mengunci payroll')

  const { id } = await params
  const periodeId = parseInt(id)

  const existing = await prisma.periode_penggajian.findUnique({ where: { id: periodeId } })
  if (!existing) return errorResponse('Periode penggajian tidak ditemukan', 404)
  const newStatus = existing.status === 'terkunci' ? 'draft' : 'terkunci'

  const updated = await prisma.periode_penggajian.update({
    where: { id: periodeId },
    data: { status: newStatus },
  })

  // Catat Audit Log
  await prisma.log_aktivitas.create({
    data: {
      account_id: session.id,
      aksi: newStatus === 'terkunci' ? 'kunci' : 'buka_kunci',
      tabel_target: 'periode_penggajian',
      id_target: periodeId,
      nilai_baru: { status: newStatus },
    },
  })

  return successResponse(updated)
}

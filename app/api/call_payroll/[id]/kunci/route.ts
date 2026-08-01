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
  if (existing.status === 'terkunci') return errorResponse('Periode penggajian sudah dikunci sebelumnya')

  const updated = await prisma.periode_penggajian.update({
    where: { id: periodeId },
    data: { status: 'terkunci' },
  })

  return successResponse(updated)
}

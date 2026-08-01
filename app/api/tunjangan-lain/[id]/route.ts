import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { updateTunjanganLainSchema } from '@/lib/validations/payroll-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  const { id } = await params
  const tunjanganId = parseInt(id)
  if (isNaN(tunjanganId)) return errorResponse('ID tidak valid')

  const existing = await prisma.tunjangan_lain.findUnique({ where: { id: tunjanganId } })
  if (!existing) return notFoundResponse()

  try {
    const body = await request.json()
    const result = updateTunjanganLainSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const updateData: Record<string, unknown> = {}
    if (result.data.nama !== undefined) updateData.nama = result.data.nama
    if (result.data.nominal !== undefined) updateData.nominal = result.data.nominal
    if (result.data.jabatan_target_id !== undefined) updateData.jabatan_id = result.data.jabatan_target_id
    if (result.data.tanggal_pencairan !== undefined) updateData.tanggal_pencairan = new Date(result.data.tanggal_pencairan)
    if (result.data.status_aktif !== undefined) updateData.status_aktif = result.data.status_aktif

    const updated = await prisma.tunjangan_lain.update({ where: { id: tunjanganId }, data: updateData })
    return successResponse(updated)
  } catch (error) {
    console.error('Update tunjangan error:', error)
    return errorResponse('Gagal mengubah tunjangan', 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  const { id } = await params
  const tunjanganId = parseInt(id)
  if (isNaN(tunjanganId)) return errorResponse('ID tidak valid')

  const existing = await prisma.tunjangan_lain.findUnique({ where: { id: tunjanganId } })
  if (!existing) return notFoundResponse()

  await prisma.tunjangan_lain.delete({ where: { id: tunjanganId } })
  return successResponse({ message: 'Tunjangan berhasil dihapus' })
}

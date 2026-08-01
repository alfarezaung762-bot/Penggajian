import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { updatePotonganSchema } from '@/lib/validations/potongan-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  const { id } = await params
  const potonganId = parseInt(id)
  if (isNaN(potonganId)) return errorResponse('ID tidak valid')

  try {
    const existing = await prisma.jenis_potongan.findUnique({ where: { id: potonganId } })
    if (!existing) return notFoundResponse('Potongan tidak ditemukan')

    const body = await request.json()
    const result = updatePotonganSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const updated = await prisma.jenis_potongan.update({ where: { id: potonganId }, data: result.data })
    return successResponse(updated)
  } catch (error) {
    console.error('Update potongan error:', error)
    return errorResponse('Gagal mengubah potongan', 500)
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
  const potonganId = parseInt(id)
  if (isNaN(potonganId)) return errorResponse('ID tidak valid')

  const existing = await prisma.jenis_potongan.findUnique({ where: { id: potonganId } })
  if (!existing) return notFoundResponse('Potongan tidak ditemukan')

  await prisma.jenis_potongan.delete({ where: { id: potonganId } })
  return successResponse({ message: 'Potongan berhasil dihapus' })
}

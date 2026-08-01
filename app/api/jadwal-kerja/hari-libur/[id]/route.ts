import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

// DELETE — hapus hari libur
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  const { id } = await params
  const hariLiburId = parseInt(id)
  if (isNaN(hariLiburId)) return errorResponse('ID tidak valid')

  const existing = await prisma.hari_libur.findUnique({ where: { id: hariLiburId } })
  if (!existing) return notFoundResponse('Hari libur tidak ditemukan')

  await prisma.hari_libur.delete({ where: { id: hariLiburId } })
  return successResponse({ message: 'Hari libur berhasil dihapus' })
}

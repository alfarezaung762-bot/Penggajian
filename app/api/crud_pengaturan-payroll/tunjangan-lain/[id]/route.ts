import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// PATCH — Edit tunjangan insidental (Admin/Owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse('Hanya Admin/Owner yang berhak mengubah tunjangan')

  const { id } = await params
  const tunjanganId = parseInt(id)

  try {
    const body = await request.json()
    const updated = await prisma.tunjangan_lain.update({
      where: { id: tunjanganId },
      data: {
        ...(body.nama && { nama: body.nama }),
        ...(body.nominal && { nominal: parseFloat(body.nominal) }),
        ...(body.tanggal_pencairan && { tanggal_pencairan: new Date(body.tanggal_pencairan) }),
        ...(body.jabatan_id !== undefined && {
          jabatan_id: body.jabatan_id ? parseInt(body.jabatan_id) : null,
        }),
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Update tunjangan lain error:', error)
    return errorResponse('Gagal memperbarui tunjangan insidental', 500)
  }
}

// DELETE — Hapus tunjangan insidental (Admin/Owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse('Hanya Admin/Owner yang berhak menghapus tunjangan')

  const { id } = await params
  const tunjanganId = parseInt(id)

  try {
    const deleted = await prisma.tunjangan_lain.delete({
      where: { id: tunjanganId },
    })

    return successResponse(deleted)
  } catch (error) {
    console.error('Delete tunjangan lain error:', error)
    return errorResponse('Gagal menghapus tunjangan insidental', 500)
  }
}

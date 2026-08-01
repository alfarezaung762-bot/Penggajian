import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { updatePotonganSchema } from '@/lib/validations/potongan-schema'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

// PATCH — Edit jenis potongan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const { id } = await params
  const potonganId = parseInt(id)

  try {
    const body = await request.json()
    const result = updatePotonganSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const updated = await prisma.jenis_potongan.update({
      where: { id: potonganId },
      data: {
        ...(result.data.nama && { nama: result.data.nama }),
        ...(result.data.kategori && { kategori: result.data.kategori as 'bpjs' | 'pajak' | 'kehadiran' | 'kustom' }),
        ...(result.data.mode_hitung && { mode_hitung: result.data.mode_hitung as 'otomatis' | 'manual' }),
        ...(result.data.tipe_nilai && { tipe_nilai: result.data.tipe_nilai as 'nominal' | 'persen' }),
        ...(result.data.nilai_default !== undefined && result.data.nilai_default !== null && { nilai_default: result.data.nilai_default }),
        ...(result.data.status_aktif !== undefined && { status_aktif: result.data.status_aktif }),
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Update jenis potongan error:', error)
    return errorResponse('Gagal memperbarui jenis potongan', 500)
  }
}

// DELETE — Nonaktifkan / Hapus jenis potongan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const { id } = await params
  const potonganId = parseInt(id)

  try {
    const updated = await prisma.jenis_potongan.update({
      where: { id: potonganId },
      data: { status_aktif: false },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Delete jenis potongan error:', error)
    return errorResponse('Gagal menghapus jenis potongan', 500)
  }
}

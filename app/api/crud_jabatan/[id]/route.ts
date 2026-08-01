import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { updateJabatanSchema } from '@/lib/validations/jabatan-schema'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

// PATCH — update jabatan (khusus HRD)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd') return forbiddenResponse('Hanya HRD yang dapat mengubah jabatan')

  const { id } = await params
  const jabatanId = parseInt(id)
  if (isNaN(jabatanId)) return errorResponse('ID tidak valid')

  try {
    const existing = await prisma.jabatan.findUnique({ where: { id: jabatanId } })
    if (!existing) return notFoundResponse('Jabatan tidak ditemukan')

    const body = await request.json()
    const result = updateJabatanSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const updated = await prisma.jabatan.update({
      where: { id: jabatanId },
      data: result.data,
    })

    await catatLog({
      accountId: session.id,
      aksi: 'ubah',
      tabelTarget: 'jabatan',
      idTarget: jabatanId,
      nilaiLama: {
        nama: existing.nama,
        gaji_pokok: Number(existing.gaji_pokok),
        tunjangan_jabatan: Number(existing.tunjangan_jabatan),
        uang_makan: Number(existing.uang_makan),
      },
      nilaiBaru: {
        nama: updated.nama,
        gaji_pokok: Number(updated.gaji_pokok),
        tunjangan_jabatan: Number(updated.tunjangan_jabatan),
        uang_makan: Number(updated.uang_makan),
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Update jabatan error:', error)
    return errorResponse('Gagal mengubah jabatan', 500)
  }
}

// DELETE — hapus jabatan (khusus HRD)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd') return forbiddenResponse('Hanya HRD yang dapat menghapus jabatan')

  const { id } = await params
  const jabatanId = parseInt(id)
  if (isNaN(jabatanId)) return errorResponse('ID tidak valid')

  try {
    const existing = await prisma.jabatan.findUnique({
      where: { id: jabatanId },
      include: { _count: { select: { employee: true } } },
    })
    if (!existing) return notFoundResponse('Jabatan tidak ditemukan')

    if (existing._count.employee > 0) {
      return errorResponse(`Jabatan masih digunakan oleh ${existing._count.employee} karyawan. Pindahkan karyawan terlebih dahulu.`)
    }

    await prisma.jabatan.delete({ where: { id: jabatanId } })

    await catatLog({
      accountId: session.id,
      aksi: 'hapus',
      tabelTarget: 'jabatan',
      idTarget: jabatanId,
      nilaiLama: {
        nama: existing.nama,
        gaji_pokok: Number(existing.gaji_pokok),
        tunjangan_jabatan: Number(existing.tunjangan_jabatan),
        uang_makan: Number(existing.uang_makan),
      },
    })

    return successResponse({ message: 'Jabatan berhasil dihapus' })
  } catch (error) {
    console.error('Delete jabatan error:', error)
    return errorResponse('Gagal menghapus jabatan', 500)
  }
}

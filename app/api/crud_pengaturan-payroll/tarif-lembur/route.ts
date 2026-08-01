import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — List tarif lembur (Admin/Owner)
export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const list = await prisma.tarif_lembur.findMany({
    orderBy: { id: 'asc' },
  })

  return successResponse(list)
}

// PUT — Update tarif lembur (Admin/Owner & HRD)
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner' && session.role !== 'hrd') return forbiddenResponse('Hanya Admin/Owner dan HRD yang dapat mengubah tarif lembur')

  try {
    const body = await request.json()
    const { id, multiplier } = body

    if (!id || !multiplier || multiplier <= 0) {
      return errorResponse('ID dan nilai multiplier lembur wajib diisi dengan benar')
    }

    const existing = await prisma.tarif_lembur.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return errorResponse('Tarif lembur tidak ditemukan', 404)

    const updated = await prisma.tarif_lembur.update({
      where: { id: parseInt(id) },
      data: { multiplier: parseFloat(multiplier) },
    })

    await catatLog({
      accountId: session.id,
      aksi: 'ubah',
      tabelTarget: 'tarif_lembur',
      idTarget: existing.id,
      nilaiLama: { tipe_hari: existing.tipe_hari, multiplier: Number(existing.multiplier) },
      nilaiBaru: { tipe_hari: updated.tipe_hari, multiplier: Number(updated.multiplier) },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Update tarif lembur error:', error)
    return errorResponse('Gagal memperbarui tarif lembur', 500)
  }
}

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { catatLog } from '@/lib/log-aktivitas'
import { updateTarifLemburSchema } from '@/lib/validations/payroll-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const tarif = await prisma.tarif_lembur.findMany({ orderBy: { tipe_hari: 'asc' } })
  return successResponse(tarif)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner' && session.role !== 'hrd') return forbiddenResponse()

  try {
    const body = await request.json()
    const result = updateTarifLemburSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const existing = await prisma.tarif_lembur.findFirst({
      where: { tipe_hari: result.data.tipe_hari as 'kerja' | 'libur' },
    })
    if (!existing) return notFoundResponse('Tarif tidak ditemukan')

    const updated = await prisma.tarif_lembur.update({
      where: { id: existing.id },
      data: { multiplier: result.data.multiplier },
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
    return errorResponse('Gagal mengubah tarif lembur', 500)
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request)
}

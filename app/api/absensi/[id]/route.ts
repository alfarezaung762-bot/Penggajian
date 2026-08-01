import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// PUT / PATCH — Koreksi status absensi oleh HRD/Admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse('Hanya HRD atau Admin yang dapat mengoreksi absensi')

  try {
    const { id } = await params
    const absensiId = parseInt(id)
    if (isNaN(absensiId)) return errorResponse('ID Absensi tidak valid')

    const body = await request.json()
    const { status, alasan } = body

    if (!status || !['hadir', 'telat', 'alpha', 'sakit', 'cuti', 'libur'].includes(status)) {
      return errorResponse('Status absensi tidak valid')
    }

    if (!alasan || alasan.trim() === '') {
      return errorResponse('Alasan koreksi wajib diisi oleh HRD')
    }

    const existing = await prisma.absensi.findUnique({
      where: { id: absensiId },
    })

    if (!existing) return errorResponse('Data absensi tidak ditemukan')

    const updated = await prisma.absensi.update({
      where: { id: absensiId },
      data: {
        status: status as any,
        dikoreksi_hrd: true,
        dikoreksi_oleh: session.id,
        catatan_alasan: alasan,
      },
    })

    // Catat Audit Log secara otomatis
    await catatLog({
      accountId: session.id,
      aksi: 'ubah',
      tabelTarget: 'absensi',
      idTarget: absensiId,
      nilaiLama: { status: existing.status, catatan_alasan: existing.catatan_alasan },
      nilaiBaru: { status, catatan_alasan: alasan, dikoreksi_oleh: session.name },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Koreksi absensi error:', error)
    return errorResponse('Gagal mengoreksi status absensi', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context)
}

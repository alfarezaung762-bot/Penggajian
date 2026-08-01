import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createTunjanganLainSchema } from '@/lib/validations/payroll-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const tunjangan = await prisma.tunjangan_lain.findMany({
    include: { jabatan: { select: { nama: true } } },
    orderBy: { tanggal_pencairan: 'desc' },
  })

  const mapped = tunjangan.map(t => ({
    ...t,
    jabatan_target: t.jabatan,
  }))

  return successResponse(mapped)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  try {
    const body = await request.json()
    const result = createTunjanganLainSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const tunjangan = await prisma.tunjangan_lain.create({
      data: {
        jabatan_id: result.data.jabatan_target_id ?? null,
        nama: result.data.nama,
        nominal: result.data.nominal,
        tanggal_pencairan: new Date(result.data.tanggal_pencairan),
        status_aktif: result.data.status_aktif ?? true,
      },
    })
    return successResponse(tunjangan, 201)
  } catch (error) {
    console.error('Create tunjangan error:', error)
    return errorResponse('Gagal menambah tunjangan', 500)
  }
}

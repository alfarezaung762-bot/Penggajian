import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createHariLiburSchema } from '@/lib/validations/jadwal-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — list hari libur
export async function GET() {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  const hariLibur = await prisma.hari_libur.findMany({
    orderBy: { tanggal: 'desc' },
    include: { account: { select: { name: true } } },
  })

  return successResponse(hariLibur)
}

// POST — tambah hari libur (HRD only)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  try {
    const body = await request.json()
    const result = createHariLiburSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    // Cek duplikat tanggal
    const existing = await prisma.hari_libur.findUnique({
      where: { tanggal: new Date(result.data.tanggal) },
    })
    if (existing) return errorResponse('Tanggal tersebut sudah terdaftar sebagai hari libur')

    const hariLibur = await prisma.hari_libur.create({
      data: {
        created_by: session.id,
        tanggal: new Date(result.data.tanggal),
        keterangan: result.data.keterangan,
      },
    })

    return successResponse(hariLibur, 201)
  } catch (error) {
    console.error('Create hari libur error:', error)
    return errorResponse('Gagal menambah hari libur', 500)
  }
}

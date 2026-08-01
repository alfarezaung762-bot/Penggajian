import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createPotonganSchema } from '@/lib/validations/potongan-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const potongan = await prisma.jenis_potongan.findMany({ orderBy: { nama: 'asc' } })
  return successResponse(potongan)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  try {
    const body = await request.json()
    const result = createPotonganSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const potongan = await prisma.jenis_potongan.create({ data: result.data })
    return successResponse(potongan, 201)
  } catch (error) {
    console.error('Create potongan error:', error)
    return errorResponse('Gagal menambah potongan', 500)
  }
}

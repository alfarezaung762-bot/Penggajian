import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — List tunjangan insidental/lainnya
export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const list = await prisma.tunjangan_lain.findMany({
    include: { jabatan: { select: { nama: true } } },
    orderBy: { id: 'desc' },
  })

  return successResponse(list)
}

// POST — Tambah tunjangan insidental baru (Admin/Owner only)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse('Hanya Admin/Owner yang dapat membuat tunjangan insidental')

  try {
    const body = await request.json()
    const { nama, nominal, tanggal_pencairan, jabatan_id } = body

    if (!nama || !nominal || !tanggal_pencairan) {
      return errorResponse('Nama, nominal, dan tanggal pencairan wajib diisi')
    }

    const created = await prisma.tunjangan_lain.create({
      data: {
        nama,
        nominal: parseFloat(nominal),
        tanggal_pencairan: new Date(tanggal_pencairan),
        jabatan_id: jabatan_id ? parseInt(jabatan_id) : null,
      },
    })

    return successResponse(created, 201)
  } catch (error) {
    console.error('Create tunjangan lain error:', error)
    return errorResponse('Gagal membuat tunjangan insidental', 500)
  }
}

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createPotonganSchema } from '@/lib/validations/potongan-schema'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

// GET — List semua jenis potongan (HRD & Admin/Owner)
export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const list = await prisma.jenis_potongan.findMany({
    orderBy: { id: 'asc' },
  })

  return successResponse(list)
}

// POST — Tambah jenis potongan baru (HRD & Admin/Owner)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  try {
    const body = await request.json()
    const result = createPotonganSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const created = await prisma.jenis_potongan.create({
      data: {
        nama: result.data.nama,
        kategori: result.data.kategori as 'bpjs' | 'pajak' | 'kehadiran' | 'kustom',
        mode_hitung: result.data.mode_hitung as 'otomatis' | 'manual',
        tipe_nilai: result.data.tipe_nilai as 'nominal' | 'persen',
        nilai_default: result.data.nilai_default ?? 0,
        status_aktif: result.data.status_aktif ?? true,
      },
    })

    return successResponse(created, 201)
  } catch (error) {
    console.error('Create jenis potongan error:', error)
    return errorResponse('Gagal membuat jenis potongan', 500)
  }
}

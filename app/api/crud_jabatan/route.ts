import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createJabatanSchema } from '@/lib/validations/jabatan-schema'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — list semua jabatan (HRD & Admin)
export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') {
    return unauthorizedResponse()
  }

  const jabatanList = await prisma.jabatan.findMany({
    orderBy: { nama: 'asc' },
    include: { _count: { select: { employee: true } } },
  })

  return successResponse(jabatanList)
}

// POST — tambah jabatan baru (khusus HRD)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') {
    return unauthorizedResponse()
  }
  if (session.role !== 'hrd') {
    return forbiddenResponse('Hanya HRD yang dapat menambah jabatan')
  }

  try {
    const body = await request.json()
    const result = createJabatanSchema.safeParse(body)
    if (!result.success) {
      return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')
    }

    const jabatan = await prisma.jabatan.create({
      data: {
        nama: result.data.nama,
        gaji_pokok: result.data.gaji_pokok,
        tunjangan_jabatan: result.data.tunjangan_jabatan ?? 0,
        uang_makan: result.data.uang_makan ?? 0,
      },
    })

    await catatLog({
      accountId: session.id,
      aksi: 'buat',
      tabelTarget: 'jabatan',
      idTarget: jabatan.id,
      nilaiBaru: {
        nama: jabatan.nama,
        gaji_pokok: Number(jabatan.gaji_pokok),
        tunjangan_jabatan: Number(jabatan.tunjangan_jabatan),
        uang_makan: Number(jabatan.uang_makan),
      },
    })

    return successResponse(jabatan, 201)
  } catch (error) {
    console.error('Create jabatan error:', error)
    return errorResponse('Gagal menambah jabatan', 500)
  }
}

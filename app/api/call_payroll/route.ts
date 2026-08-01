import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { processPayrollPeriode } from '@/lib/services/payroll-service'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — List semua periode penggajian
export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const list = await prisma.periode_penggajian.findMany({
    orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
    include: {
      account: { select: { name: true } },
      _count: { select: { slip_gaji: true } },
    },
  })

  return successResponse(list)
}

// POST — Memicu proses generate payroll baru
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  try {
    const body = await request.json()
    const bulan = parseInt(body.bulan)
    const tahun = parseInt(body.tahun)

    if (!bulan || !tahun || bulan < 1 || bulan > 12) {
      return errorResponse('Bulan (1-12) dan tahun wajib diisi dengan benar')
    }

    const result = await processPayrollPeriode({
      bulan,
      tahun,
      accountId: session.id,
    })

    return successResponse(result, 201)
  } catch (error) {
    console.error('Call payroll error:', error)
    return errorResponse('Gagal memproses penggajian', 500)
  }
}

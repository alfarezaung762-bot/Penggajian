import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — Laporan Gaji Bulanan Agregasi (Read-only)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  const url = request.nextUrl
  const bulan = parseInt(url.searchParams.get('bulan') || String(new Date().getMonth() + 1))
  const tahun = parseInt(url.searchParams.get('tahun') || String(new Date().getFullYear()))

  try {
    const periode = await prisma.periode_penggajian.findFirst({
      where: { bulan, tahun },
    })

    if (!periode) {
      return successResponse({
        periode: null,
        reports: [],
        total_transfer: 0,
      })
    }

    const slips = await prisma.slip_gaji.findMany({
      where: { periode_penggajian_id: periode.id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            nik: true,
            bank_account_number: true,
            jabatan: { select: { nama: true } },
          },
        },
      },
      orderBy: { employee_id: 'asc' },
    })

    const reports = slips.map((s) => ({
      id: s.id,
      employee: s.employee,
      gaji_pokok: Number(s.gaji_pokok),
      tunjangan_jabatan: Number(s.tunjangan_jabatan),
      uang_makan: Number(s.uang_makan),
      total_lembur: Number(s.total_lembur),
      total_tunjangan_lain: Number(s.total_tunjangan_lain),
      total_potongan: Number(s.total_potongan),
      gaji_net: Number(s.gaji_bersih),
      generated_at: s.generated_at,
    }))

    const totalTransfer = reports.reduce((sum, r) => sum + r.gaji_net, 0)

    return successResponse({
      periode,
      reports,
      total_transfer: totalTransfer,
    })
  } catch (error) {
    console.error('Laporan gaji error:', error)
    return errorResponse('Gagal memuat laporan gaji', 500)
  }
}

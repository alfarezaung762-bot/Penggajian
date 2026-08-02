import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'
import { processPayrollPeriode } from '@/lib/services/payroll-service'

// PUT — Atur Cutoff & Re-Calculate Draf Payroll (Admin/Owner & HRD)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const { id } = await params
  const periodeId = parseInt(id)

  const body = await request.json()
  const { tanggal_selesai } = body

  if (!tanggal_selesai) {
    return errorResponse('Tanggal selesai/cutoff wajib diisi', 400)
  }

  const existing = await prisma.periode_penggajian.findUnique({ where: { id: periodeId } })
  if (!existing) return errorResponse('Periode penggajian tidak ditemukan', 404)

  // Guard 1: Hanya boleh diubah jika status draft
  if (existing.status === 'terkunci') {
    return errorResponse('Periode penggajian sudah dikunci. Buka kunci terlebih dahulu untuk merubah tanggal cutoff.', 400)
  }

  const newCutoffDate = new Date(tanggal_selesai)
  const lastDayOfMonth = new Date(existing.tahun, existing.bulan, 0).getDate()

  // Guard 2: Boundary guard - tanggal_selesai harus berada antara tanggal 20 s/d tanggal terakhir bulan tersebut
  if (
    newCutoffDate.getFullYear() !== existing.tahun ||
    newCutoffDate.getMonth() + 1 !== existing.bulan ||
    newCutoffDate.getDate() < 20 ||
    newCutoffDate.getDate() > lastDayOfMonth
  ) {
    return errorResponse(`Tanggal cutoff harus berada antara tanggal 20 s/d ${lastDayOfMonth} pada bulan ${existing.bulan}-${existing.tahun}`, 400)
  }

  // Guard 3: Auto Re-Calculate draf payroll
  await processPayrollPeriode({ bulan: existing.bulan, tahun: existing.tahun, accountId: session.id })

  // Guard 4: Audit Trail
  const newCutoffStr = newCutoffDate.toISOString().split('T')[0]

  await prisma.log_aktivitas.create({
    data: {
      account_id: session.id,
      aksi: 'ubah',
      tabel_target: 'periode_penggajian',
      id_target: periodeId,
      nilai_baru: { cutoff: newCutoffStr },
    },
  })

  return successResponse({
    periode: existing,
    message: `Tanggal cutoff berhasil diubah menjadi ${newCutoffStr} dan draf payroll telah dihitung ulang.`,
  })
}

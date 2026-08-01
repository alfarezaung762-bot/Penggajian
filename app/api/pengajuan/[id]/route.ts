import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from '@/lib/api-response'

// GET — detail pengajuan
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  const { id } = await params
  const pengajuanId = parseInt(id)
  if (isNaN(pengajuanId)) return errorResponse('ID tidak valid')

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
    include: {
      employee: { select: { name: true, nik: true, jabatan: { select: { nama: true } } } },
      account: { select: { name: true } },
    },
  })

  if (!pengajuan) return notFoundResponse('Pengajuan tidak ditemukan')

  // Karyawan hanya lihat milik sendiri
  if (session.type === 'employee' && pengajuan.employee_id !== session.id) {
    return notFoundResponse('Pengajuan tidak ditemukan')
  }

  return successResponse(pengajuan)
}

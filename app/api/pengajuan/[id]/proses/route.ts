import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { prosesPengajuanSchema } from '@/lib/validations/pengajuan-schema'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

// PATCH — approve/reject pengajuan (HRD/Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  const { id } = await params
  const pengajuanId = parseInt(id)
  if (isNaN(pengajuanId)) return errorResponse('ID tidak valid')

  try {
    const pengajuan = await prisma.pengajuan.findUnique({
      where: { id: pengajuanId },
      include: { employee: true },
    })
    if (!pengajuan) return notFoundResponse('Pengajuan tidak ditemukan')
    if (pengajuan.status !== 'menunggu') return errorResponse('Pengajuan sudah diproses sebelumnya')

    const body = await request.json()
    const result = prosesPengajuanSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const { status, catatan_penolakan } = result.data

    // Security & Data Integrity Safeguard: jika disetujui, catatan_penolakan SELALU null
    const finalCatatan = status === 'ditolak' ? (catatan_penolakan ? catatan_penolakan.trim() : null) : null

    // Update pengajuan
    const updated = await prisma.pengajuan.update({
      where: { id: pengajuanId },
      data: {
        status: status as 'disetujui' | 'ditolak',
        diproses_oleh: session.id,
        diproses_pada: new Date(),
        catatan_penolakan: finalCatatan,
      },
    })

    // Jika cuti disetujui, update saldo cuti
    if (status === 'disetujui' && pengajuan.jenis === 'cuti' && pengajuan.tanggal_mulai_cuti && pengajuan.tanggal_selesai_cuti) {
      const startDate = new Date(pengajuan.tanggal_mulai_cuti)
      const endDate = new Date(pengajuan.tanggal_selesai_cuti)
      const jumlahHari = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      await prisma.saldo_cuti.updateMany({
        where: {
          employee_id: pengajuan.employee_id,
          tahun: startDate.getFullYear(),
        },
        data: { terpakai: { increment: jumlahHari } },
      })

      // Buat record absensi 'cuti' untuk setiap hari
      const dates: Date[] = []
      const current = new Date(startDate)
      while (current <= endDate) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }

      for (const date of dates) {
        await prisma.absensi.upsert({
          where: {
            employee_id_tanggal: {
              employee_id: pengajuan.employee_id,
              tanggal: date,
            },
          },
          create: {
            employee_id: pengajuan.employee_id,
            tanggal: date,
            status: 'cuti',
          },
          update: { status: 'cuti' },
        })
      }
    }

    // Jika sakit disetujui, buat record absensi 'sakit'
    if (status === 'disetujui' && pengajuan.jenis === 'sakit' && pengajuan.tanggal_sakit) {
      await prisma.absensi.upsert({
        where: {
          employee_id_tanggal: {
            employee_id: pengajuan.employee_id,
            tanggal: new Date(pengajuan.tanggal_sakit),
          },
        },
        create: {
          employee_id: pengajuan.employee_id,
          tanggal: new Date(pengajuan.tanggal_sakit),
          status: 'sakit',
        },
        update: { status: 'sakit' },
      })
    }

    // Audit log
    await catatLog({
      accountId: session.id,
      aksi: status === 'disetujui' ? 'setujui' : 'tolak',
      tabelTarget: 'pengajuan',
      idTarget: pengajuanId,
      nilaiLama: { status: 'menunggu' },
      nilaiBaru: { status, catatan_penolakan: finalCatatan },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Proses pengajuan error:', error)
    return errorResponse('Gagal memproses pengajuan', 500)
  }
}

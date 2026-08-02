import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { updateEmployeeSchema } from '@/lib/validations/employee-schema'
import { catatLog } from '@/lib/log-aktivitas'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

// GET — detail karyawan
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  const { id } = await params
  const employeeId = parseInt(id)
  if (isNaN(employeeId)) return errorResponse('ID tidak valid')

  // Karyawan hanya bisa lihat data sendiri
  if (session.type === 'employee' && session.id !== employeeId) return forbiddenResponse()

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { jabatan: true },
    omit: { password_hash: true },
  })

  if (!employee) return notFoundResponse('Karyawan tidak ditemukan')

  return successResponse(employee)
}

// PATCH — update karyawan (HRD/Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const { id } = await params
  const employeeId = parseInt(id)
  if (isNaN(employeeId)) return errorResponse('ID tidak valid')

  try {
    const existing = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!existing) return notFoundResponse('Karyawan tidak ditemukan')

    const body = await request.json()
    const result = updateEmployeeSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    // Cek NIK/username unik jika diubah
    if (result.data.nik && result.data.nik !== existing.nik) {
      const dup = await prisma.employee.findUnique({ where: { nik: result.data.nik } })
      if (dup) return errorResponse('NIK sudah terdaftar')
    }
    if (result.data.username && result.data.username !== existing.username) {
      const dup = await prisma.employee.findUnique({ where: { username: result.data.username } })
      if (dup) return errorResponse('Username sudah digunakan')
    }

    const updateData: Record<string, unknown> = { ...result.data }
    if (result.data.join_date) updateData.join_date = new Date(result.data.join_date)

    if (result.data.photo_url && result.data.photo_url.startsWith('data:image/')) {
      try {
        const { uploadFotoProfil } = await import('@/lib/cloudinary_service/upload-foto-profil')
        updateData.photo_url = await uploadFotoProfil(result.data.photo_url, employeeId)
      } catch (err) {
        console.warn('Gagal update foto profil:', err)
      }
    }

    // Recalculate tanggal nonaktif if relevant fields changed
    if (result.data.status_kepegawaian || result.data.durasi_kontrak_bulan || result.data.join_date) {
      const kepegawaian = result.data.status_kepegawaian || existing.status_kepegawaian
      const durasi = result.data.durasi_kontrak_bulan ?? existing.durasi_kontrak_bulan
      const joinDate = result.data.join_date ? new Date(result.data.join_date) : existing.join_date

      if (kepegawaian === 'kontrak' && durasi) {
        const nonaktif = new Date(joinDate)
        nonaktif.setMonth(nonaktif.getMonth() + durasi)
        updateData.tanggal_nonaktif_otomatis = nonaktif
      } else if (kepegawaian === 'tetap') {
        updateData.tanggal_nonaktif_otomatis = null
        updateData.durasi_kontrak_bulan = null
      }
    }

    // Track status change for audit log
    const statusChanged = result.data.is_active !== undefined && result.data.is_active !== existing.is_active

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: { jabatan: true },
      omit: { password_hash: true },
    })

    if (statusChanged) {
      await catatLog({
        accountId: session.id,
        aksi: 'ubah',
        tabelTarget: 'employee',
        idTarget: employeeId,
        nilaiLama: { is_active: existing.is_active },
        nilaiBaru: { is_active: result.data.is_active },
      })
    }

    return successResponse(updated)
  } catch (error) {
    console.error('Update employee error:', error)
    return errorResponse('Gagal mengubah karyawan', 500)
  }
}

// DELETE — nonaktifkan karyawan (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const { id } = await params
  const employeeId = parseInt(id)
  if (isNaN(employeeId)) return errorResponse('ID tidak valid')

  try {
    const existing = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!existing) return notFoundResponse('Karyawan tidak ditemukan')

    await prisma.employee.update({
      where: { id: employeeId },
      data: { is_active: false },
    })

    await catatLog({
      accountId: session.id,
      aksi: 'ubah',
      tabelTarget: 'employee',
      idTarget: employeeId,
      nilaiLama: { is_active: true },
      nilaiBaru: { is_active: false },
    })

    return successResponse({ message: 'Karyawan berhasil dinonaktifkan' })
  } catch (error) {
    console.error('Delete employee error:', error)
    return errorResponse('Gagal menonaktifkan karyawan', 500)
  }
}

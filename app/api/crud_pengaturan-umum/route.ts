import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// In-memory / env fallback configuration
let defaultSetting = {
  id: 1,
  kuota_cuti_tahunan: 12,
  toleransi_keterlambatan_menit: 15,
  nama_perusahaan: 'PT SANTOSO MAKMUR JAYA',
}

// GET — Ambil Pengaturan Umum (kuota cuti tahunan, toleransi telat)
export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  return successResponse(defaultSetting)
}

// PUT — Update Pengaturan Umum (Admin/Owner only)
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse('Hanya Admin/Owner yang dapat mengedit pengaturan umum')

  try {
    const body = await request.json()
    const { kuota_cuti_tahunan, toleransi_keterlambatan_menit, nama_perusahaan } = body

    defaultSetting = {
      ...defaultSetting,
      ...(kuota_cuti_tahunan !== undefined && { kuota_cuti_tahunan: parseInt(kuota_cuti_tahunan) }),
      ...(toleransi_keterlambatan_menit !== undefined && { toleransi_keterlambatan_menit: parseInt(toleransi_keterlambatan_menit) }),
      ...(nama_perusahaan && { nama_perusahaan }),
    }

    return successResponse(defaultSetting)
  } catch (error) {
    console.error('Update pengaturan umum error:', error)
    return errorResponse('Gagal memperbarui pengaturan umum', 500)
  }
}

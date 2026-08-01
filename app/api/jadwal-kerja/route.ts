import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

const HARI_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'] as const

// Helper untuk buat Date dari string "HH:mm"
function parseTimeString(timeStr: string | null | undefined): Date | null {
  if (!timeStr || timeStr.trim() === '' || timeStr.toLowerCase() === 'null') return null
  const clean = timeStr.trim()
  if (clean.includes('T')) return new Date(clean)
  const parts = clean.split(':')
  if (parts.length < 2) return null
  const h = parts[0].padStart(2, '0')
  const m = parts[1].padStart(2, '0')
  return new Date(`1970-01-01T${h}:${m}:00Z`)
}

// GET — list jadwal kerja mingguan (auto-seed 7 hari jika kosong) + hari libur
export async function GET() {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  let listJadwal = await prisma.jadwal_kerja.findMany()

  // Auto-seed 7 hari jika belum ada di DB
  if (listJadwal.length === 0) {
    const defaultData = HARI_ORDER.map((hari) => {
      const isWeekend = hari === 'sabtu' || hari === 'minggu'
      return {
        hari,
        jam_masuk: isWeekend ? null : parseTimeString('08:00'),
        jam_pulang: isWeekend ? null : parseTimeString('17:00'),
        toleransi_telat_menit: isWeekend ? 0 : 15,
      }
    })

    await prisma.jadwal_kerja.createMany({
      data: defaultData,
    })

    listJadwal = await prisma.jadwal_kerja.findMany()
  }

  // Sort sesuai urutan Senin - Minggu
  listJadwal.sort((a, b) => HARI_ORDER.indexOf(a.hari as any) - HARI_ORDER.indexOf(b.hari as any))

  const listLibur = await prisma.hari_libur.findMany({
    orderBy: { tanggal: 'asc' },
  })

  return successResponse({
    jadwal: listJadwal,
    hari_libur: listLibur,
  })
}

// PUT / PATCH — update jam kerja per hari (HRD & Admin only)
async function handleUpdateJadwal(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  try {
    const body = await request.json()
    const { hari, jam_masuk, jam_pulang, toleransi_telat_menit } = body

    if (!hari || !HARI_ORDER.includes(hari.toLowerCase())) {
      return errorResponse('Nama hari tidak valid')
    }

    const targetHari = hari.toLowerCase() as 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'

    const existing = await prisma.jadwal_kerja.findFirst({
      where: { hari: targetHari },
    })

    const parsedJamMasuk = parseTimeString(jam_masuk)
    const parsedJamPulang = parseTimeString(jam_pulang)
    const parsedToleransi = typeof toleransi_telat_menit === 'number' ? toleransi_telat_menit : parseInt(toleransi_telat_menit || '15')

    let updated
    if (existing) {
      updated = await prisma.jadwal_kerja.update({
        where: { id: existing.id },
        data: {
          jam_masuk: parsedJamMasuk,
          jam_pulang: parsedJamPulang,
          toleransi_telat_menit: parsedToleransi,
        },
      })
    } else {
      updated = await prisma.jadwal_kerja.create({
        data: {
          hari: targetHari,
          jam_masuk: parsedJamMasuk,
          jam_pulang: parsedJamPulang,
          toleransi_telat_menit: parsedToleransi,
        },
      })
    }

    return successResponse(updated)
  } catch (error) {
    console.error('Update jadwal error:', error)
    return errorResponse('Gagal memperbarui jadwal kerja', 500)
  }
}

export async function PUT(request: NextRequest) {
  return handleUpdateJadwal(request)
}

export async function PATCH(request: NextRequest) {
  return handleUpdateJadwal(request)
}

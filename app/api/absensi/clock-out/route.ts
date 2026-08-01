import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { uploadFotoAbsensi } from '@/lib/cloudinary_service/upload-foto-absensi'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

const HARI_MAP: Record<number, string> = {
  0: 'minggu', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu',
}

// PATCH — absensi pulang (karyawan)
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'employee') return unauthorizedResponse()

  try {
    const body = await request.json()
    const foto = body.foto || body.foto_pulang
    if (!foto) return errorResponse('Foto wajib diambil untuk absensi pulang')

    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

    // Cek sudah absen masuk
    const existing = await prisma.absensi.findFirst({
      where: { employee_id: session.id, tanggal: today },
    })
    if (!existing || !existing.jam_masuk) return errorResponse('Anda belum absen masuk hari ini')
    if (existing.jam_pulang) return errorResponse('Anda sudah absen pulang hari ini')

    // Cek jadwal untuk validasi waktu pulang
    const hariIni = HARI_MAP[now.getDay()]
    const jadwal = await prisma.jadwal_kerja.findFirst({
      where: { hari: hariIni as 'senin' },
    })

    if (jadwal && jadwal.jam_pulang) {
      const jamPulangJadwal = new Date(jadwal.jam_pulang)
      const jamPulangHari = jamPulangJadwal.getUTCHours()
      const menitPulangHari = jamPulangJadwal.getUTCMinutes()

      // Tombol pulang dikunci sampai 1 menit sebelum jam pulang
      const batasAwalPulang = new Date(now)
      batasAwalPulang.setHours(jamPulangHari, menitPulangHari - 1, 0, 0)

      // Tombol pulang mati 10 jam setelah jam pulang
      const batasAkhirPulang = new Date(now)
      batasAkhirPulang.setHours(jamPulangHari + 10, menitPulangHari, 0, 0)

      const formattedJamPulang = `${String(jamPulangHari).padStart(2, '0')}:${String(menitPulangHari).padStart(2, '0')}`

      if (now < batasAwalPulang) {
        return errorResponse(`Absen pulang dikunci sampai 1 menit sebelum jam pulang (Pukul ${formattedJamPulang} WIB)`)
      }
      if (now > batasAkhirPulang) {
        return errorResponse('Waktu absensi pulang telah berakhir')
      }
    }

    // Upload foto (dengan fallback jika error)
    const fotoUrl = await uploadFotoAbsensi(foto, session.id, 'pulang')

    const jamPulangTime = new Date(`1970-01-01T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`)

    const updated = await prisma.absensi.update({
      where: { id: existing.id },
      data: {
        jam_pulang: jamPulangTime,
        foto_pulang_url: fotoUrl,
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Absensi pulang error:', error)
    return errorResponse('Gagal melakukan absensi pulang', 500)
  }
}

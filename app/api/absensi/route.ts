import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { uploadFotoAbsensi } from '@/lib/cloudinary_service/upload-foto-absensi'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

const HARI_MAP: Record<number, string> = {
  0: 'minggu', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu',
}

// GET — list absensi / rekap
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  const url = request.nextUrl
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '200')

  const where: Record<string, unknown> = {}

  if (session.type === 'employee') {
    where.employee_id = session.id
  } else {
    const employeeId = url.searchParams.get('employee_id')
    if (employeeId) where.employee_id = parseInt(employeeId)
  }

  const bulan = url.searchParams.get('bulan')
  const tahun = url.searchParams.get('tahun')
  const tanggalParam = url.searchParams.get('tanggal')
  const startDateParam = url.searchParams.get('start_date') || url.searchParams.get('tanggal_mulai')
  const endDateParam = url.searchParams.get('end_date') || url.searchParams.get('tanggal_selesai')

  if (startDateParam && endDateParam) {
    const start = new Date(startDateParam)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDateParam)
    end.setHours(23, 59, 59, 999)
    where.tanggal = { gte: start, lte: end }
  } else if (tanggalParam) {
    const [y, m, d] = tanggalParam.split('-').map(Number)
    if (y && m && d) {
      where.tanggal = new Date(Date.UTC(y, m - 1, d))
    } else {
      const tgl = new Date(tanggalParam)
      where.tanggal = new Date(Date.UTC(tgl.getFullYear(), tgl.getMonth(), tgl.getDate()))
    }
  } else if (bulan && tahun) {
    const startDate = new Date(parseInt(tahun), parseInt(bulan) - 1, 1, 0, 0, 0)
    const endDate = new Date(parseInt(tahun), parseInt(bulan), 0, 23, 59, 59, 999)
    where.tanggal = { gte: startDate, lte: endDate }
  } else if (tahun) {
    const startDate = new Date(parseInt(tahun), 0, 1, 0, 0, 0)
    const endDate = new Date(parseInt(tahun), 11, 31, 23, 59, 59, 999)
    where.tanggal = { gte: startDate, lte: endDate }
  }

  let empJoinDate: string | null = null
  if (session.type === 'employee') {
    const empData = await prisma.employee.findUnique({
      where: { id: session.id },
      select: { join_date: true }
    })
    if (empData?.join_date) {
      empJoinDate = (empData.join_date as Date).toISOString().split('T')[0]
    }
  }

  // Cek status absensi hari ini (untuk karyawan)
  if (session.type === 'employee' && url.searchParams.get('today') === 'true') {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const todayAbsensi = await prisma.absensi.findFirst({
      where: { employee_id: session.id, tanggal: today },
    })

    const hariIni = HARI_MAP[now.getDay()]
    const jadwal = await prisma.jadwal_kerja.findFirst({ where: { hari: hariIni as 'senin' } })
    const isLibur = await prisma.hari_libur.findFirst({ where: { tanggal: today } })

    // Ambil seluruh jadwal seminggu untuk modal Karyawan
    const seluruhJadwal = await prisma.jadwal_kerja.findMany()

    return successResponse({
      absensi_hari_ini: todayAbsensi,
      jadwal,
      seluruh_jadwal: seluruhJadwal,
      is_libur: !!isLibur,
      hari: hariIni,
      join_date: empJoinDate,
    })
  }

  let pengajuanList: unknown[] = []
  let hariLiburList: unknown[] = []
  let jadwalKerjaList: unknown[] = []

  if (bulan && tahun) {
    const startDate = new Date(parseInt(tahun), parseInt(bulan) - 1, 1, 0, 0, 0)
    const endDate = new Date(parseInt(tahun), parseInt(bulan), 0, 23, 59, 59, 999)

    const empId = session.type === 'employee' ? session.id : (url.searchParams.get('employee_id') ? parseInt(url.searchParams.get('employee_id')!) : undefined)

    const [pengajuanData, liburData, jadwalData] = await Promise.all([
      empId ? prisma.pengajuan.findMany({
        where: {
          employee_id: empId,
          status: 'disetujui',
          OR: [
            { tanggal_mulai_cuti: { lte: endDate }, tanggal_selesai_cuti: { gte: startDate } },
            { tanggal_sakit: { gte: startDate, lte: endDate } },
            { tanggal_lembur: { gte: startDate, lte: endDate } }
          ]
        }
      }) : [],
      prisma.hari_libur.findMany({
        where: { tanggal: { gte: startDate, lte: endDate } }
      }),
      prisma.jadwal_kerja.findMany()
    ])

    pengajuanList = pengajuanData
    hariLiburList = liburData
    jadwalKerjaList = jadwalData
  }

  const [absensiList, total] = await Promise.all([
    prisma.absensi.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            nik: true,
            jabatan: { select: { nama: true } },
          },
        },
        account: { select: { name: true } },
      },
      orderBy: { tanggal: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.absensi.count({ where }),
  ])

  return successResponse({
    pengajuan: pengajuanList,
    hari_libur: hariLiburList,
    jadwal_kerja: jadwalKerjaList,
    absensi: absensiList,
    join_date: empJoinDate,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST — absensi masuk (karyawan)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'employee') return unauthorizedResponse()

  try {
    const body = await request.json()
    const foto = body.foto || body.foto_masuk
    if (!foto) return errorResponse('Foto wajib diambil untuk absensi masuk')

    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

    // Cek apakah sudah absen hari ini
    const existing = await prisma.absensi.findFirst({
      where: { employee_id: session.id, tanggal: today },
    })
    if (existing && existing.jam_masuk) return errorResponse('Anda sudah absen masuk hari ini')

    // Cek hari libur
    const isLibur = await prisma.hari_libur.findFirst({ where: { tanggal: today } })
    if (isLibur) return errorResponse('Hari ini adalah hari libur')

    // Cek jadwal kerja hari ini
    const hariIni = HARI_MAP[now.getDay()]
    const jadwal = await prisma.jadwal_kerja.findFirst({
      where: { hari: hariIni as 'senin' },
    })

    if (!jadwal || !jadwal.jam_masuk) return errorResponse('Tidak ada jadwal masuk untuk hari ini')

    const jamMasukJadwal = new Date(jadwal.jam_masuk)
    const jamMasukHari = jamMasukJadwal.getUTCHours()
    const menitMasukHari = jamMasukJadwal.getUTCMinutes()

    // Cek apakah tombol masuk aktif (1 jam sebelum jam masuk)
    const batasAwal = new Date(now)
    batasAwal.setHours(jamMasukHari - 1, menitMasukHari, 0, 0)

    const batasTelat = new Date(now)
    batasTelat.setHours(jamMasukHari, menitMasukHari + jadwal.toleransi_telat_menit, 0, 0)

    if (now < batasAwal) return errorResponse(`Tombol absensi masuk aktif mulai pukul ${String(jamMasukHari - 1).padStart(2, '0')}:${String(menitMasukHari).padStart(2, '0')}`)
    if (now > batasTelat) return errorResponse('Waktu absensi masuk telah berakhir. Anda tercatat Alpha.')

    // Tentukan status
    const jamMasukTarget = new Date(now)
    jamMasukTarget.setHours(jamMasukHari, menitMasukHari, 0, 0)
    const status = now <= jamMasukTarget ? 'hadir' : 'telat'

    let menitTelat = 0
    if (status === 'telat') {
      const diffMs = now.getTime() - jamMasukTarget.getTime()
      menitTelat = Math.max(1, Math.floor(diffMs / (1000 * 60)))
    }

    // Upload foto (dengan fallback jika error)
    const fotoUrl = await uploadFotoAbsensi(foto, session.id, 'masuk')

    // Jam masuk sebagai TIME
    const jamMasukTime = new Date(`1970-01-01T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`)

    const absensi = await prisma.absensi.upsert({
      where: {
        employee_id_tanggal: {
          employee_id: session.id,
          tanggal: today,
        },
      },
      create: {
        employee_id: session.id,
        tanggal: today,
        jam_masuk: jamMasukTime,
        foto_masuk_url: fotoUrl,
        status: status as 'hadir' | 'telat',
        catatan_alasan: status === 'telat' ? `Telat ${menitTelat} menit` : null,
      },
      update: {
        jam_masuk: jamMasukTime,
        foto_masuk_url: fotoUrl,
        status: status as 'hadir' | 'telat',
        catatan_alasan: status === 'telat' ? `Telat ${menitTelat} menit` : null,
      },
    })

    return successResponse(absensi, 201)
  } catch (error) {
    console.error('Absensi masuk error:', error)
    return errorResponse('Gagal melakukan absensi masuk', 500)
  }
}

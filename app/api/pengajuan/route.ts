import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { pengajuanSchema } from '@/lib/validations/pengajuan-schema'
import { uploadFotoPengajuan } from '@/lib/cloudinary_service/upload-foto-pengajuan'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

// GET — riwayat pengajuan (dengan auto-reject jika HRD belum meng-acc hingga tanggal lewat)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  const url = request.nextUrl
  const status = url.searchParams.get('status')
  const jenis = url.searchParams.get('jenis')
  const countOnly = url.searchParams.get('count_only') === 'true'
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  // Auto-reject pengajuan status "menunggu" yang sudah melewati tanggal pelaksanaan tanpa acc HRD
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    await prisma.pengajuan.updateMany({
      where: {
        status: 'menunggu',
        OR: [
          { tanggal_mulai_cuti: { lt: today } },
          { tanggal_sakit: { lt: today } },
          { tanggal_lembur: { lt: today } },
        ],
      },
      data: {
        status: 'ditolak',
        catatan_penolakan: 'Otomatis Ditolak Sistem (Tidak disetujui HRD hingga tanggal pelaksanaan/pelayanan tiba)',
        diproses_pada: new Date(),
      },
    })
  } catch (err) {
    console.error('Auto-reject error:', err)
  }

  const where: Record<string, unknown> = {}

  // Karyawan hanya lihat milik sendiri
  if (session.type === 'employee') {
    where.employee_id = session.id
  }

  if (status) where.status = status
  if (jenis) where.jenis = jenis

  const tanggalParam = url.searchParams.get('tanggal')
  const tanggalMulai = url.searchParams.get('tanggal_mulai')
  const tanggalSelesai = url.searchParams.get('tanggal_selesai')
  const search = url.searchParams.get('search')

  if (tanggalParam === 'today' || url.searchParams.get('today') === 'true') {
    const tgl = new Date()
    tgl.setHours(0, 0, 0, 0)
    const tglEnd = new Date(tgl)
    tglEnd.setHours(23, 59, 59, 999)
    where.OR = [
      { diajukan_pada: { gte: tgl, lte: tglEnd } },
      { tanggal_mulai_cuti: { gte: tgl, lte: tglEnd } },
      { tanggal_sakit: { gte: tgl, lte: tglEnd } },
      { tanggal_lembur: { gte: tgl, lte: tglEnd } },
    ]
  } else if (tanggalParam && tanggalParam !== 'semua') {
    const tgl = new Date(tanggalParam)
    tgl.setHours(0, 0, 0, 0)
    const tglEnd = new Date(tgl)
    tglEnd.setHours(23, 59, 59, 999)
    where.OR = [
      { diajukan_pada: { gte: tgl, lte: tglEnd } },
      { tanggal_mulai_cuti: { gte: tgl, lte: tglEnd } },
      { tanggal_sakit: { gte: tgl, lte: tglEnd } },
      { tanggal_lembur: { gte: tgl, lte: tglEnd } },
    ]
  } else if (tanggalMulai && tanggalSelesai) {
    const start = new Date(tanggalMulai)
    start.setHours(0, 0, 0, 0)
    const end = new Date(tanggalSelesai)
    end.setHours(23, 59, 59, 999)
    where.OR = [
      { diajukan_pada: { gte: start, lte: end } },
      { tanggal_mulai_cuti: { gte: start, lte: end } },
      { tanggal_sakit: { gte: start, lte: end } },
      { tanggal_lembur: { gte: start, lte: end } },
    ]
  }

  if (search) {
    where.employee = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
      ]
    }
  }

  if (countOnly) {
    const count = await prisma.pengajuan.count({ where })
    return successResponse({ count })
  }

  const [pengajuanList, total] = await Promise.all([
    prisma.pengajuan.findMany({
      where,
      include: {
        employee: { select: { name: true, nik: true, jabatan: { select: { nama: true } } } },
        account: { select: { name: true } },
      },
      orderBy: { diajukan_pada: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pengajuan.count({ where }),
  ])

  return successResponse({
    pengajuan: pengajuanList,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST — ajukan cuti/sakit/lembur (karyawan)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'employee') return unauthorizedResponse()

  try {
    const body = await request.json()
    const result = pengajuanSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const data = result.data
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Validasi minimal H-2 untuk cuti dan lembur
    if (data.jenis === 'cuti') {
      const targetDate = new Date(data.tanggal_mulai_cuti)
      targetDate.setHours(0, 0, 0, 0)

      const diffMs = targetDate.getTime() - now.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays < 2) {
        return errorResponse('Pengajuan cuti wajib diajukan minimal H-2 (2 hari sebelum tanggal mulai)')
      }

      // Cek saldo cuti
      const saldo = await prisma.saldo_cuti.findFirst({
        where: { employee_id: session.id, tahun: now.getFullYear() },
      })
      if (!saldo) return errorResponse('Saldo cuti belum dikonfigurasi untuk tahun ini')

      const startDate = new Date(data.tanggal_mulai_cuti)
      const endDate = new Date(data.tanggal_selesai_cuti)
      const jumlahHari = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const sisa = saldo.kuota - saldo.terpakai

      if (sisa <= 0) return errorResponse('Saldo cuti tahunan Anda telah habis (0 hari)')
      if (jumlahHari > sisa) {
        return errorResponse(`Durasi cuti (${jumlahHari} hari) melebihi sisa saldo cuti Anda yang tersisa (${sisa} hari)`)
      }
    }

    if (data.jenis === 'lembur') {
      const targetDate = new Date(data.tanggal_lembur)
      targetDate.setHours(0, 0, 0, 0)

      const diffMs = targetDate.getTime() - now.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays < 2) {
        return errorResponse('Pengajuan lembur wajib diajukan minimal H-2 (2 hari sebelum tanggal lembur)')
      }
    }

    // Upload foto jika ada (untuk Sakit atau Lembur)
    let fotoUrl: string | null = null
    if ('foto_bukti' in data && data.foto_bukti && data.foto_bukti !== 'placeholder') {
      const jenisFoto = data.jenis === 'sakit' ? 'sakit' : 'lembur'
      fotoUrl = await uploadFotoPengajuan(data.foto_bukti, session.id, jenisFoto)
    }

    // Hitung total menit lembur
    let totalMenitLembur: number | null = null
    if (data.jenis === 'lembur') {
      const [hMulai, mMulai] = data.jam_mulai_lembur.split(':').map(Number)
      const [hSelesai, mSelesai] = data.jam_selesai_lembur.split(':').map(Number)
      totalMenitLembur = (hSelesai * 60 + mSelesai) - (hMulai * 60 + mMulai)
    }

    const pengajuan = await prisma.pengajuan.create({
      data: {
        employee_id: session.id,
        jenis: data.jenis,
        tanggal_mulai_cuti: data.jenis === 'cuti' ? new Date(data.tanggal_mulai_cuti) : null,
        tanggal_selesai_cuti: data.jenis === 'cuti' ? new Date(data.tanggal_selesai_cuti) : null,
        alasan_cuti: data.jenis === 'cuti' ? data.alasan_cuti : null,
        tanggal_sakit: data.jenis === 'sakit' ? new Date(data.tanggal_sakit) : null,
        tanggal_lembur: data.jenis === 'lembur' ? new Date(data.tanggal_lembur) : null,
        jam_mulai_lembur: data.jenis === 'lembur' ? new Date(`1970-01-01T${data.jam_mulai_lembur}:00`) : null,
        jam_selesai_lembur: data.jenis === 'lembur' ? new Date(`1970-01-01T${data.jam_selesai_lembur}:00`) : null,
        total_menit_lembur: totalMenitLembur,
        foto_bukti_url: fotoUrl,
      },
    })

    return successResponse(pengajuan, 201)
  } catch (error) {
    console.error('Create pengajuan error:', error)
    return errorResponse('Gagal membuat pengajuan', 500)
  }
}

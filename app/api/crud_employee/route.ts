import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createEmployeeSchema } from '@/lib/validations/employee-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

const KUOTA_CUTI_DEFAULT = 12

// GET — list karyawan (HRD & Admin)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const url = request.nextUrl
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') // 'aktif' | 'nonaktif' | undefined

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nik: { contains: search } },
      { username: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status === 'aktif') where.is_active = true
  else if (status === 'nonaktif') where.is_active = false

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { jabatan: true },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      omit: { password_hash: true },
    }),
    prisma.employee.count({ where }),
  ])

  return successResponse({
    employees,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST — tambah karyawan (HRD only)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'hrd' && session.role !== 'admin_owner') return forbiddenResponse()

  try {
    const body = await request.json()
    const result = createEmployeeSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    // Cek NIK dan username unik
    const [existingNik, existingUsername] = await Promise.all([
      prisma.employee.findUnique({ where: { nik: result.data.nik } }),
      prisma.employee.findUnique({ where: { username: result.data.username } }),
    ])
    if (existingNik) return errorResponse('NIK sudah terdaftar')
    if (existingUsername) return errorResponse('Username sudah digunakan')

    // Cek jabatan ada
    const jabatan = await prisma.jabatan.findUnique({ where: { id: result.data.jabatan_id } })
    if (!jabatan) return errorResponse('Jabatan tidak ditemukan')

    const hashedPassword = await bcrypt.hash(result.data.password, 10)

    // Hitung tanggal nonaktif otomatis jika kontrak
    let tanggalNonaktif: Date | null = null
    if (result.data.status_kepegawaian === 'kontrak' && result.data.durasi_kontrak_bulan) {
      const joinDate = new Date(result.data.join_date)
      tanggalNonaktif = new Date(joinDate)
      tanggalNonaktif.setMonth(tanggalNonaktif.getMonth() + result.data.durasi_kontrak_bulan)
    }

    let photoUrl = result.data.photo_url ?? null
    if (photoUrl && photoUrl.startsWith('data:image/')) {
      try {
        const { uploadFotoProfil } = await import('@/lib/cloudinary_service/upload-foto-profil')
        photoUrl = await uploadFotoProfil(photoUrl, Date.now())
      } catch (err) {
        console.warn('Gagal upload foto profil:', err)
      }
    }

    const employee = await prisma.employee.create({
      data: {
        jabatan_id: result.data.jabatan_id,
        nik: result.data.nik,
        name: result.data.name,
        username: result.data.username,
        password_hash: hashedPassword,
        gender: result.data.gender as 'L' | 'P',
        join_date: new Date(result.data.join_date),
        status_pernikahan: result.data.status_pernikahan as 'TK' | 'K',
        jumlah_tanggungan: result.data.jumlah_tanggungan,
        bank_account_number: result.data.bank_account_number,
        status_kepegawaian: result.data.status_kepegawaian as 'tetap' | 'kontrak',
        durasi_kontrak_bulan: result.data.durasi_kontrak_bulan ?? null,
        tanggal_nonaktif_otomatis: tanggalNonaktif,
        photo_url: photoUrl,
      },
      include: { jabatan: true },
      omit: { password_hash: true },
    })

    // Buat saldo cuti untuk tahun berjalan
    const currentYear = new Date().getFullYear()
    await prisma.saldo_cuti.create({
      data: {
        employee_id: employee.id,
        tahun: currentYear,
        kuota: KUOTA_CUTI_DEFAULT,
        terpakai: 0,
      },
    })

    return successResponse(employee, 201)
  } catch (error) {
    console.error('Create employee error:', error)
    return errorResponse('Gagal menambah karyawan', 500)
  }
}

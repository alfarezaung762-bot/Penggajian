import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { processPayrollPeriode } from '@/lib/services/payroll-service'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — Detail payroll slip_gaji per bulan & tahun
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  const url = request.nextUrl
  const bulan = parseInt(url.searchParams.get('bulan') || String(new Date().getMonth() + 1))
  const tahun = parseInt(url.searchParams.get('tahun') || String(new Date().getFullYear()))

  try {
    const totalActiveEmployees = await prisma.employee.count({
      where: { is_active: true },
    })

    const periode = await prisma.periode_penggajian.findFirst({
      where: { bulan, tahun },
    })

    if (!periode) {
      return successResponse({
        periode: null,
        payroll: [],
        total_karyawan_aktif: totalActiveEmployees,
        is_locked: false,
      })
    }

    // Jika karyawan, hanya tampilkan slip jika periode sudah terkunci dan khusus milik dirinya sendiri
    if (session.type === 'employee' && periode.status !== 'terkunci') {
      return successResponse({
        periode,
        payroll: [],
        total_karyawan_aktif: totalActiveEmployees,
        is_locked: false,
      })
    }

    const whereSlip: Record<string, unknown> = { periode_penggajian_id: periode.id }
    if (session.type === 'employee') {
      whereSlip.employee_id = session.id
    }

    const slips = await prisma.slip_gaji.findMany({
      where: whereSlip,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            nik: true,
            status_pernikahan: true,
            jumlah_tanggungan: true,
            jabatan: { select: { nama: true } },
          },
        },
        slip_gaji_detail: true,
      },
      orderBy: { employee_id: 'asc' },
    })

    const payroll = slips.map((s) => {
      const gajiPokok = Number(s.gaji_pokok)
      const tunjJabatan = Number(s.tunjangan_jabatan)
      const uangMakan = Number(s.uang_makan)
      const totalJamLembur = Number(s.total_lembur || 0)
      const pph21 = Number(s.slip_gaji_detail.find((d) => d.nama_komponen.toLowerCase().includes('pph 21'))?.nominal || 0)
      const uangLembur = Number(s.slip_gaji_detail.find((d) => d.nama_komponen === 'Upah Lembur')?.nominal || 0)
      const tunjangLain = Number(s.slip_gaji_detail.find((d) => d.nama_komponen === 'Tunjangan Lainnya')?.nominal || 0)

      const totalPendapatan = gajiPokok + tunjJabatan + uangMakan + tunjangLain + uangLembur

      const isKawin = String(s.employee.status_pernikahan) === 'K' || String(s.employee.status_pernikahan) === 'menikah'
      const kodePtkp = `${isKawin ? 'K' : 'TK'}/${Math.min(s.employee.jumlah_tanggungan || 0, 3)}`

      // Group semua komponen potongan secara dinamis tanpa duplikasi
      const detailPotonganList = s.slip_gaji_detail.filter((d) => d.tipe === 'potongan')
      const detailPotongan: Record<string, number> = {}
      detailPotonganList.forEach((d) => {
        detailPotongan[d.nama_komponen] = Number(d.nominal)
      })

      return {
        id: s.id,
        employee: s.employee,
        status_ptkp: kodePtkp,
        gaji_pokok: gajiPokok,
        tunjangan_jabatan: tunjJabatan,
        uang_makan: uangMakan,
        tunjangan_lain: tunjangLain,
        uang_lembur: uangLembur,
        total_jam_lembur: totalJamLembur,
        total_pendapatan: totalPendapatan,
        total_potongan: Number(s.total_potongan),
        detail_potongan: detailPotongan,
        pph21: pph21,
        gaji_net: Number(s.gaji_bersih),
        is_locked: periode.status === 'terkunci',
      }
    })

    return successResponse({
      periode,
      payroll,
      total_karyawan_aktif: totalActiveEmployees,
      is_locked: periode.status === 'terkunci',
    })
  } catch (error) {
    console.error('Get payroll error:', error)
    return errorResponse('Gagal mengambil data penggajian', 500)
  }
}

// POST — Hitung / Generasi payroll via service
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  try {
    const body = await request.json()
    const bulan = parseInt(body.bulan)
    const tahun = parseInt(body.tahun)

    if (!bulan || !tahun || bulan < 1 || bulan > 12) {
      return errorResponse('Bulan (1-12) dan tahun wajib diisi dengan benar')
    }

    const result = await processPayrollPeriode({
      bulan,
      tahun,
      accountId: session.id,
    })

    return successResponse(result, 201)
  } catch (error) {
    console.error('Payroll API error:', error)
    return errorResponse('Gagal memproses penggajian', 500)
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak (khusus HRD/Admin)' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const whereClause: any = {};
  if (month && year) {
    whereClause.periode_penggajian = {
      bulan: parseInt(month, 10),
      tahun: parseInt(year, 10),
    };
  }

  const slipList = await prisma.slip_gaji.findMany({
    where: whereClause,
    include: {
      employee: { include: { jabatan: true } },
      periode_penggajian: true,
      slip_gaji_detail: true,
    },
    orderBy: { generated_at: 'desc' },
  });

  const totalGajiPokok = slipList.reduce((sum, item) => sum + Number(item.gaji_pokok), 0);
  const totalTunjanganJabatan = slipList.reduce((sum, item) => sum + Number(item.tunjangan_jabatan), 0);
  const totalUangMakan = slipList.reduce((sum, item) => sum + Number(item.uang_makan), 0);
  const totalLembur = slipList.reduce((sum, item) => sum + Number(item.total_lembur), 0);
  const totalTunjanganLain = slipList.reduce((sum, item) => sum + Number(item.total_tunjangan_lain), 0);
  const totalPotongan = slipList.reduce((sum, item) => sum + Number(item.total_potongan), 0);
  const totalGajiBersih = slipList.reduce((sum, item) => sum + Number(item.gaji_bersih), 0);

  return NextResponse.json({
    data: {
      slips: slipList,
      summary: {
        total_karyawan: slipList.length,
        total_gaji_pokok: totalGajiPokok,
        total_tunjangan_jabatan: totalTunjanganJabatan,
        total_uang_makan: totalUangMakan,
        total_lembur: totalLembur,
        total_tunjangan_lain: totalTunjanganLain,
        total_potongan: totalPotongan,
        total_gaji_bersih: totalGajiBersih,
      },
    },
  });
}

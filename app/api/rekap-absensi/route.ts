import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak (khusus HRD/Admin)' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const employees = await prisma.employee.findMany({
    where: { is_active: true },
    include: { jabatan: true },
  });

  const rekapData = [];

  for (const emp of employees) {
    const absensiList = await prisma.absensi.findMany({
      where: {
        employee_id: emp.id,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalHadir = absensiList.filter((a) => a.status === 'hadir').length;
    const totalTelat = absensiList.filter((a) => a.status === 'telat').length;
    const totalAlpha = absensiList.filter((a) => a.status === 'alpha').length;
    const totalSakit = absensiList.filter((a) => a.status === 'sakit').length;
    const totalCuti = absensiList.filter((a) => a.status === 'cuti').length;

    // Total jam lembur
    const lemburList = await prisma.pengajuan.findMany({
      where: {
        employee_id: emp.id,
        jenis: 'lembur',
        status: 'disetujui',
        tanggal_lembur: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    const totalMenitLembur = lemburList.reduce((acc, l) => acc + (l.total_menit_lembur || 0), 0);
    const totalJamLembur = Math.round((totalMenitLembur / 60) * 10) / 10;

    rekapData.push({
      employee: emp,
      bulan: month,
      tahun: year,
      total_hadir: totalHadir,
      total_telat: totalTelat,
      total_alpha: totalAlpha,
      total_sakit: totalSakit,
      total_cuti: totalCuti,
      total_jam_lembur: totalJamLembur,
    });
  }

  return NextResponse.json({ data: rekapData });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const employeeIdParam = searchParams.get('employee_id');

  const whereClause: any = {};

  if (session.role === 'karyawan') {
    whereClause.employee_id = session.employee_id;
  } else if (employeeIdParam) {
    whereClause.employee_id = parseInt(employeeIdParam, 10);
  }

  if (month && year) {
    const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0);
    whereClause.tanggal = {
      gte: startDate,
      lte: endDate,
    };
  }

  const absensiList = await prisma.absensi.findMany({
    where: whereClause,
    include: { employee: true, account: true },
    orderBy: { tanggal: 'desc' },
  });

  return NextResponse.json({ data: absensiList });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan' || !session.employee_id) {
    return NextResponse.json({ error: 'Akses ditolak (khusus Karyawan)' }, { status: 403 });
  }

  try {
    const { foto_masuk_url } = await request.json();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDate = new Date(todayStr);

    const existing = await prisma.absensi.findUnique({
      where: {
        employee_id_tanggal: {
          employee_id: session.employee_id,
          tanggal: todayDate,
        },
      },
    });

    if (existing && existing.jam_masuk) {
      return NextResponse.json({ error: 'Anda sudah melakukan presensi masuk hari ini' }, { status: 400 });
    }

    // Tentukan status hadir vs telat berdasarkan jadwal kerja hari ini
    const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'] as const;
    const currentDayName = dayNames[today.getDay()];
    const jadwal = await prisma.jadwal_kerja.findUnique({ where: { hari: currentDayName } });

    let statusPresensi: 'hadir' | 'telat' = 'hadir';

    if (jadwal && jadwal.jam_masuk) {
      const jamMasukScheduled = new Date(jadwal.jam_masuk);
      const currentTime = new Date(`1970-01-01T${today.toTimeString().split(' ')[0]}Z`);
      const scheduledTime = new Date(`1970-01-01T${jamMasukScheduled.toTimeString().split(' ')[0]}Z`);
      
      const diffMinutes = (currentTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
      if (diffMinutes > (jadwal.toleransi_telat_menit || 15)) {
        statusPresensi = 'telat';
      }
    }

    const created = await prisma.absensi.upsert({
      where: {
        employee_id_tanggal: {
          employee_id: session.employee_id,
          tanggal: todayDate,
        },
      },
      update: {
        jam_masuk: today,
        foto_masuk_url: foto_masuk_url ?? null,
        status: statusPresensi,
      },
      create: {
        employee_id: session.employee_id,
        tanggal: todayDate,
        jam_masuk: today,
        foto_masuk_url: foto_masuk_url ?? null,
        status: statusPresensi,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('Error clock-in presensi:', error);
    return NextResponse.json({ error: 'Gagal melakukan presensi masuk' }, { status: 500 });
  }
}

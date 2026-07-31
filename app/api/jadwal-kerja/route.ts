import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const ALL_HARI = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'] as const;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  let jadwalList = await prisma.jadwal_kerja.findMany({
    orderBy: { id: 'asc' },
  });

  // If table is empty or incomplete, ensure all 7 days exist with default schedules
  if (jadwalList.length < 7) {
    for (const h of ALL_HARI) {
      const exists = jadwalList.find((j) => j.hari === h);
      if (!exists) {
        const isWeekend = h === 'sabtu' || h === 'minggu';
        const jamMasuk = isWeekend ? null : new Date('1970-01-01T08:00:00Z');
        const jamPulang = isWeekend ? null : new Date('1970-01-01T17:00:00Z');

        await prisma.jadwal_kerja.upsert({
          where: { hari: h },
          update: {},
          create: {
            hari: h,
            jam_masuk: jamMasuk,
            jam_pulang: jamPulang,
            toleransi_telat_menit: 15,
          },
        });
      }
    }
    jadwalList = await prisma.jadwal_kerja.findMany({
      orderBy: { id: 'asc' },
    });
  }

  return NextResponse.json({ data: jadwalList });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { hari, jam_masuk, jam_pulang, is_libur_rutin } = await request.json();

    if (!hari) {
      return NextResponse.json({ error: 'Hari wajib ditentukan' }, { status: 400 });
    }

    const jamMasukDate = is_libur_rutin || !jam_masuk ? null : new Date(`1970-01-01T${jam_masuk}:00Z`);
    const jamPulangDate = is_libur_rutin || !jam_pulang ? null : new Date(`1970-01-01T${jam_pulang}:00Z`);

    const updated = await prisma.jadwal_kerja.upsert({
      where: { hari: hari as any },
      update: {
        jam_masuk: jamMasukDate,
        jam_pulang: jamPulangDate,
      },
      create: {
        hari: hari as any,
        jam_masuk: jamMasukDate,
        jam_pulang: jamPulangDate,
        toleransi_telat_menit: 15,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error update jadwal kerja:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jadwal kerja' }, { status: 500 });
  }
}

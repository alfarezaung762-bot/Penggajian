import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan' || !session.employee_id) {
    return NextResponse.json({ error: 'Akses ditolak (khusus Karyawan)' }, { status: 403 });
  }

  try {
    const { foto_pulang_url } = await request.json();
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

    if (!existing || !existing.jam_masuk) {
      return NextResponse.json({ error: 'Anda belum melakukan presensi masuk hari ini' }, { status: 400 });
    }

    if (existing.jam_pulang) {
      return NextResponse.json({ error: 'Anda sudah melakukan presensi pulang hari ini' }, { status: 400 });
    }

    const updated = await prisma.absensi.update({
      where: { id: existing.id },
      data: {
        jam_pulang: today,
        foto_pulang_url: foto_pulang_url ?? null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error clock-out presensi:', error);
    return NextResponse.json({ error: 'Gagal melakukan presensi pulang' }, { status: 500 });
  }
}

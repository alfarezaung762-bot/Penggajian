import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  // Pengaturan umum diambil dari jadwal_kerja toleransi & default saldo_cuti
  const jadwal = await prisma.jadwal_kerja.findFirst();
  const kuotaCutiSample = await prisma.saldo_cuti.findFirst();

  return NextResponse.json({
    data: {
      kuota_cuti_tahunan: kuotaCutiSample ? kuotaCutiSample.kuota : 12,
      toleransi_telat_menit: jadwal ? jadwal.toleransi_telat_menit : 15,
    },
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  try {
    const { kuota_cuti_tahunan, toleransi_telat_menit } = await request.json();

    if (toleransi_telat_menit !== undefined) {
      await prisma.jadwal_kerja.updateMany({
        data: { toleransi_telat_menit: parseInt(toleransi_telat_menit, 10) },
      });
    }

    if (kuota_cuti_tahunan !== undefined) {
      const year = new Date().getFullYear();
      await prisma.saldo_cuti.updateMany({
        where: { tahun: year },
        data: { kuota: parseInt(kuota_cuti_tahunan, 10) },
      });
    }

    return NextResponse.json({ data: { message: 'Pengaturan umum berhasil diperbarui' } });
  } catch (error) {
    console.error('Error update pengaturan umum:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan umum' }, { status: 500 });
  }
}

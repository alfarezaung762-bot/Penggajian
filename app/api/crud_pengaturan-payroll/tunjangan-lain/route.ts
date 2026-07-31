import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const tunjanganList = await prisma.tunjangan_lain.findMany({
    include: { jabatan: true },
    orderBy: { tanggal_pencairan: 'desc' },
  });

  return NextResponse.json({ data: tunjanganList });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  try {
    const { nama, nominal, tanggal_pencairan, jabatan_target_id, status_aktif } = await request.json();

    if (!nama || !nominal || !tanggal_pencairan) {
      return NextResponse.json({ error: 'Nama, nominal, dan tanggal pencairan wajib diisi' }, { status: 400 });
    }

    const created = await prisma.tunjangan_lain.create({
      data: {
        nama,
        nominal: parseFloat(nominal),
        tanggal_pencairan: new Date(tanggal_pencairan),
        jabatan_id: jabatan_target_id ? parseInt(jabatan_target_id, 10) : null,
        status_aktif: status_aktif !== undefined ? status_aktif : true,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('Error create tunjangan lain:', error);
    return NextResponse.json({ error: 'Gagal membuat tunjangan lain' }, { status: 500 });
  }
}

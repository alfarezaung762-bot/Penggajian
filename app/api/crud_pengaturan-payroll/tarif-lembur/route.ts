import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const tarifList = await prisma.tarif_lembur.findMany({
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({ data: tarifList });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  try {
    const { id, multiplier } = await request.json();
    if (!id || multiplier === undefined) {
      return NextResponse.json({ error: 'ID dan multiplier wajib diisi' }, { status: 400 });
    }

    const updated = await prisma.tarif_lembur.update({
      where: { id: parseInt(id, 10) },
      data: { multiplier: parseFloat(multiplier) },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error update tarif lembur:', error);
    return NextResponse.json({ error: 'Gagal memperbarui tarif lembur' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const hariLiburList = await prisma.hari_libur.findMany({
    orderBy: { tanggal: 'asc' },
  });

  return NextResponse.json({ data: hariLiburList });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { tanggal, keterangan } = await request.json();

    if (!tanggal || !keterangan) {
      return NextResponse.json({ error: 'Tanggal dan keterangan wajib diisi' }, { status: 400 });
    }

    const accountId = session.account_id || 1;

    const created = await prisma.hari_libur.create({
      data: {
        tanggal: new Date(tanggal),
        keterangan,
        created_by: accountId,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('Error create hari libur:', error);
    return NextResponse.json({ error: 'Gagal menambah hari libur' }, { status: 500 });
  }
}

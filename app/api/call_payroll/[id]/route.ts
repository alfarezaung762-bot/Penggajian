import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const periodeId = parseInt(id, 10);

  const periode = await prisma.periode_penggajian.findUnique({
    where: { id: periodeId },
    include: {
      slip_gaji: {
        include: { employee: true, slip_gaji_detail: true },
      },
    },
  });

  if (!periode) {
    return NextResponse.json({ error: 'Periode penggajian tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: periode });
}

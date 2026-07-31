import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const pengajuanId = parseInt(id, 10);

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
    include: { employee: true, account: true },
  });

  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 });
  }

  if (session.role === 'karyawan' && session.employee_id !== pengajuan.employee_id) {
    return NextResponse.json({ error: 'Akses ditolak (IDOR Prevented)' }, { status: 403 });
  }

  return NextResponse.json({ data: pengajuan });
}

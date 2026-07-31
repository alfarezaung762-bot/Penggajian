import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const whereClause: any = {};

  if (session.role === 'karyawan') {
    whereClause.employee_id = session.employee_id;
    whereClause.periode_penggajian = {
      status: 'terkunci',
    };
  }

  const slipList = await prisma.slip_gaji.findMany({
    where: whereClause,
    include: {
      periode_penggajian: true,
      employee: { include: { jabatan: true } },
      slip_gaji_detail: true,
    },
    orderBy: { generated_at: 'desc' },
  });

  return NextResponse.json({ data: slipList });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generatePayrollPeriod } from '@/lib/services/payroll-service';

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const periodeList = await prisma.periode_penggajian.findMany({
    orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
  });

  return NextResponse.json({ data: periodeList });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  try {
    const { bulan, tahun } = await request.json();

    if (!bulan || !tahun) {
      return NextResponse.json({ error: 'Bulan dan tahun wajib diisi' }, { status: 400 });
    }

    const result = await generatePayrollPeriod({
      bulan: parseInt(bulan, 10),
      tahun: parseInt(tahun, 10),
      account_id: session.id,
    });

    return NextResponse.json({
      data: {
        message: 'Berhasil me-generate payroll periode',
        ...result,
      },
    });
  } catch (error: any) {
    console.error('Error generate payroll:', error);
    return NextResponse.json({ error: error.message || 'Gagal me-generate payroll' }, { status: 500 });
  }
}

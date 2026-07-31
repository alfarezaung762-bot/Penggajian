import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const currentYear = new Date().getFullYear();
  const empId = session.employee_id;

  if (!empId && session.role === 'karyawan') {
    return NextResponse.json({ error: 'Data karyawan tidak ditemukan' }, { status: 400 });
  }

  if (session.role === 'karyawan') {
    const saldo = await prisma.saldo_cuti.findUnique({
      where: {
        employee_id_tahun: {
          employee_id: empId!,
          tahun: currentYear,
        },
      },
    });

    const kuota = saldo ? saldo.kuota : 12;
    const terpakai = saldo ? saldo.terpakai : 0;
    const sisa = kuota - terpakai;

    return NextResponse.json({
      data: {
        tahun: currentYear,
        kuota,
        terpakai,
        sisa,
      },
    });
  }

  // HRD/Admin bisa mengambil seluruh saldo cuti
  const saldoList = await prisma.saldo_cuti.findMany({
    where: { tahun: currentYear },
    include: { employee: true },
  });

  return NextResponse.json({ data: saldoList });
}

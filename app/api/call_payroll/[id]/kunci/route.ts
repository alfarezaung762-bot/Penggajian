import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { catatLog } from '@/lib/log-aktivitas';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  const { id } = await params;
  const periodeId = parseInt(id, 10);

  try {
    const oldPeriode = await prisma.periode_penggajian.findUnique({ where: { id: periodeId } });
    if (!oldPeriode) {
      return NextResponse.json({ error: 'Periode penggajian tidak ditemukan' }, { status: 404 });
    }

    if (oldPeriode.status === 'terkunci') {
      return NextResponse.json({ error: 'Periode penggajian ini sudah terkunci' }, { status: 400 });
    }

    const updated = await prisma.periode_penggajian.update({
      where: { id: periodeId },
      data: {
        status: 'terkunci',
        dikunci_oleh: session.account_id ?? null,
        dikunci_pada: new Date(),
      },
    });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'kunci',
        tabel_target: 'periode_penggajian',
        id_target: periodeId,
        nilai_lama: { status: oldPeriode.status },
        nilai_baru: { status: 'terkunci' },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error lock payroll:', error);
    return NextResponse.json({ error: 'Gagal mengunci periode penggajian' }, { status: 500 });
  }
}

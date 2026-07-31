import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { catatLog } from '@/lib/log-aktivitas';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak (khusus HRD/Admin)' }, { status: 403 });
  }

  const { id } = await params;
  const pengajuanId = parseInt(id, 10);

  try {
    const { status, catatan_penolakan } = await request.json();

    if (!status || !['disetujui', 'ditolak'].includes(status)) {
      return NextResponse.json({ error: 'Status persetujuan tidak valid' }, { status: 400 });
    }

    const oldPengajuan = await prisma.pengajuan.findUnique({ where: { id: pengajuanId } });
    if (!oldPengajuan) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 });
    }

    if (oldPengajuan.status !== 'menunggu') {
      return NextResponse.json({ error: 'Pengajuan ini sudah pernah diproses' }, { status: 400 });
    }

    const updated = await prisma.pengajuan.update({
      where: { id: pengajuanId },
      data: {
        status,
        catatan_penolakan: status === 'ditolak' ? (catatan_penolakan ?? null) : null,
        diproses_oleh: session.account_id ?? null,
        diproses_pada: new Date(),
      },
    });

    // Update terpakai pada saldo_cuti jika pengajuan cuti disetujui
    if (oldPengajuan.jenis === 'cuti' && status === 'disetujui' && oldPengajuan.tanggal_mulai_cuti && oldPengajuan.tanggal_selesai_cuti) {
      const startDate = new Date(oldPengajuan.tanggal_mulai_cuti);
      const endDate = new Date(oldPengajuan.tanggal_selesai_cuti);
      const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const year = startDate.getFullYear();

      await prisma.saldo_cuti.upsert({
        where: {
          employee_id_tahun: {
            employee_id: oldPengajuan.employee_id,
            tahun: year,
          },
        },
        update: {
          terpakai: { increment: daysCount },
        },
        create: {
          employee_id: oldPengajuan.employee_id,
          tahun: year,
          kuota: 12,
          terpakai: daysCount,
        },
      });
    }

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: status === 'disetujui' ? 'setujui' : 'tolak',
        tabel_target: 'pengajuan',
        id_target: pengajuanId,
        nilai_lama: { status: 'menunggu' },
        nilai_baru: { status, catatan_penolakan },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error proses pengajuan:', error);
    return NextResponse.json({ error: 'Gagal memproses pengajuan' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { catatLog } from '@/lib/log-aktivitas';
import { koreksiAbsensiSchema } from '@/lib/validations/absensi-schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const absensiId = parseInt(id, 10);

  const absensi = await prisma.absensi.findUnique({
    where: { id: absensiId },
    include: { employee: true, account: true },
  });

  if (!absensi) {
    return NextResponse.json({ error: 'Data absensi tidak ditemukan' }, { status: 404 });
  }

  if (session.role === 'karyawan' && session.employee_id !== absensi.employee_id) {
    return NextResponse.json({ error: 'Akses ditolak (IDOR Prevented)' }, { status: 403 });
  }

  return NextResponse.json({ data: absensi });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak (khusus HRD/Admin)' }, { status: 403 });
  }

  const { id } = await params;
  const absensiId = parseInt(id, 10);

  try {
    const body = await request.json();
    const validatedData = koreksiAbsensiSchema.parse(body);

    const oldAbsensi = await prisma.absensi.findUnique({ where: { id: absensiId } });
    if (!oldAbsensi) {
      return NextResponse.json({ error: 'Data absensi tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.absensi.update({
      where: { id: absensiId },
      data: {
        status: validatedData.status,
        dikoreksi_hrd: true,
        catatan_alasan: validatedData.catatan_alasan,
        dikoreksi_oleh: session.account_id ?? null,
      },
    });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'ubah',
        tabel_target: 'absensi',
        id_target: absensiId,
        nilai_lama: { status: oldAbsensi.status, dikoreksi_hrd: oldAbsensi.dikoreksi_hrd },
        nilai_baru: { status: updated.status, dikoreksi_hrd: true, catatan_alasan: validatedData.catatan_alasan },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('Error koreksi absensi:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0]?.message || 'Input tidak valid' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengoreksi absensi' }, { status: 500 });
  }
}

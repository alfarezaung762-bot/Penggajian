import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  const { id } = await params;
  const tunjId = parseInt(id, 10);

  try {
    const body = await request.json();
    const updateData: any = {};
    if (body.nama) updateData.nama = body.nama;
    if (body.nominal !== undefined) updateData.nominal = parseFloat(body.nominal);
    if (body.tanggal_pencairan) updateData.tanggal_pencairan = new Date(body.tanggal_pencairan);
    if (body.jabatan_target_id !== undefined) {
      updateData.jabatan_id = body.jabatan_target_id ? parseInt(body.jabatan_target_id, 10) : null;
    }
    if (body.status_aktif !== undefined) updateData.status_aktif = body.status_aktif;

    const updated = await prisma.tunjangan_lain.update({
      where: { id: tunjId },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error update tunjangan lain:', error);
    return NextResponse.json({ error: 'Gagal memperbarui tunjangan lain' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  const { id } = await params;
  const tunjId = parseInt(id, 10);

  try {
    await prisma.tunjangan_lain.delete({ where: { id: tunjId } });
    return NextResponse.json({ data: { message: 'Tunjangan lain berhasil dihapus' } });
  } catch (error) {
    console.error('Error delete tunjangan lain:', error);
    return NextResponse.json({ error: 'Gagal menghapus tunjangan lain' }, { status: 500 });
  }
}

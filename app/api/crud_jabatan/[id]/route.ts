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
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const jabatanId = parseInt(id, 10);

  try {
    const oldJabatan = await prisma.jabatan.findUnique({ where: { id: jabatanId } });
    if (!oldJabatan) {
      return NextResponse.json({ error: 'Jabatan tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.nama) updateData.nama = body.nama;
    if (body.gaji_pokok !== undefined) updateData.gaji_pokok = parseFloat(body.gaji_pokok);
    if (body.tunjangan_jabatan !== undefined) updateData.tunjangan_jabatan = parseFloat(body.tunjangan_jabatan);
    if (body.uang_makan !== undefined) updateData.uang_makan = parseFloat(body.uang_makan);

    const updated = await prisma.jabatan.update({
      where: { id: jabatanId },
      data: updateData,
    });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'ubah',
        tabel_target: 'jabatan',
        id_target: jabatanId,
        nilai_lama: {
          nama: oldJabatan.nama,
          gaji_pokok: Number(oldJabatan.gaji_pokok),
          tunjangan_jabatan: Number(oldJabatan.tunjangan_jabatan),
          uang_makan: Number(oldJabatan.uang_makan),
        },
        nilai_baru: {
          nama: updated.nama,
          gaji_pokok: Number(updated.gaji_pokok),
          tunjangan_jabatan: Number(updated.tunjangan_jabatan),
          uang_makan: Number(updated.uang_makan),
        },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error update jabatan:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jabatan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const jabatanId = parseInt(id, 10);

  try {
    const oldJabatan = await prisma.jabatan.findUnique({ where: { id: jabatanId } });
    if (!oldJabatan) {
      return NextResponse.json({ error: 'Jabatan tidak ditemukan' }, { status: 404 });
    }

    await prisma.jabatan.delete({ where: { id: jabatanId } });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'hapus',
        tabel_target: 'jabatan',
        id_target: jabatanId,
        nilai_lama: { nama: oldJabatan.nama, gaji_pokok: Number(oldJabatan.gaji_pokok) },
      });
    }

    return NextResponse.json({ data: { message: 'Jabatan berhasil dihapus' } });
  } catch (error) {
    console.error('Error delete jabatan:', error);
    return NextResponse.json({ error: 'Gagal menghapus jabatan' }, { status: 500 });
  }
}

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
  const potId = parseInt(id, 10);

  try {
    const oldPot = await prisma.jenis_potongan.findUnique({ where: { id: potId } });
    if (!oldPot) {
      return NextResponse.json({ error: 'Jenis potongan tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.nama) updateData.nama = body.nama;
    if (body.kategori) updateData.kategori = body.kategori;
    if (body.mode_hitung) updateData.mode_hitung = body.mode_hitung;
    if (body.tipe_nilai) updateData.tipe_nilai = body.tipe_nilai;
    if (body.nilai_default !== undefined) updateData.nilai_default = parseFloat(body.nilai_default);
    if (body.status_aktif !== undefined) updateData.status_aktif = body.status_aktif;

    const updated = await prisma.jenis_potongan.update({
      where: { id: potId },
      data: updateData,
    });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'ubah',
        tabel_target: 'jenis_potongan',
        id_target: potId,
        nilai_lama: {
          nama: oldPot.nama,
          nilai_default: Number(oldPot.nilai_default),
          status_aktif: oldPot.status_aktif,
        },
        nilai_baru: {
          nama: updated.nama,
          nilai_default: Number(updated.nilai_default),
          status_aktif: updated.status_aktif,
        },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error update jenis potongan:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jenis potongan' }, { status: 500 });
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
  const potId = parseInt(id, 10);

  try {
    const oldPot = await prisma.jenis_potongan.findUnique({ where: { id: potId } });
    if (!oldPot) {
      return NextResponse.json({ error: 'Jenis potongan tidak ditemukan' }, { status: 404 });
    }

    await prisma.jenis_potongan.delete({ where: { id: potId } });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'hapus',
        tabel_target: 'jenis_potongan',
        id_target: potId,
        nilai_lama: { nama: oldPot.nama },
      });
    }

    return NextResponse.json({ data: { message: 'Jenis potongan berhasil dihapus' } });
  } catch (error) {
    console.error('Error delete jenis potongan:', error);
    return NextResponse.json({ error: 'Gagal menghapus jenis potongan' }, { status: 500 });
  }
}

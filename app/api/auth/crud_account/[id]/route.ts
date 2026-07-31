import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { catatLog } from '@/lib/log-aktivitas';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const accountId = parseInt(id, 10);
  if (isNaN(accountId)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const oldAccount = await prisma.account.findUnique({ where: { id: accountId } });
    if (!oldAccount) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.role) updateData.role = body.role;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.password) {
      updateData.password_hash = await bcrypt.hash(body.password, 10);
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
    });

    await catatLog({
      account_id: session.id,
      aksi: 'ubah',
      tabel_target: 'account',
      id_target: accountId,
      nilai_lama: { name: oldAccount.name, role: oldAccount.role, is_active: oldAccount.is_active },
      nilai_baru: { name: updatedAccount.name, role: updatedAccount.role, is_active: updatedAccount.is_active },
    });

    return NextResponse.json({ data: updatedAccount });
  } catch (error) {
    console.error('Error update account:', error);
    return NextResponse.json({ error: 'Gagal memperbarui akun' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const accountId = parseInt(id, 10);

  try {
    const oldAccount = await prisma.account.findUnique({ where: { id: accountId } });
    if (!oldAccount) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    // Soft delete (is_active = false)
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { is_active: false },
    });

    await catatLog({
      account_id: session.id,
      aksi: 'hapus',
      tabel_target: 'account',
      id_target: accountId,
      nilai_lama: { is_active: true },
      nilai_baru: { is_active: false },
    });

    return NextResponse.json({ data: updatedAccount });
  } catch (error) {
    console.error('Error deactivate account:', error);
    return NextResponse.json({ error: 'Gagal menonaktifkan akun' }, { status: 500 });
  }
}

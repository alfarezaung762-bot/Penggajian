import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);

  try {
    const { new_password } = await request.json();
    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    const updated = await prisma.employee.update({
      where: { id: empId },
      data: { password_hash },
    });

    return NextResponse.json({ data: { message: 'Password karyawan berhasil direset' } });
  } catch (error) {
    console.error('Error reset password employee:', error);
    return NextResponse.json({ error: 'Gagal mereset password karyawan' }, { status: 500 });
  }
}

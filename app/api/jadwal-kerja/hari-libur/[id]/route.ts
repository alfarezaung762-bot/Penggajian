import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const liburId = parseInt(id, 10);

  try {
    await prisma.hari_libur.delete({ where: { id: liburId } });
    return NextResponse.json({ data: { message: 'Hari libur berhasil dihapus' } });
  } catch (error) {
    console.error('Error delete hari libur:', error);
    return NextResponse.json({ error: 'Gagal menghapus hari libur' }, { status: 500 });
  }
}

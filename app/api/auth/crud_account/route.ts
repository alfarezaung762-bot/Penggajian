import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { catatLog } from '@/lib/log-aktivitas';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      is_active: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: accounts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { name, username, password, role } = await request.json();

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: 'Seluruh field wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.account.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newAccount = await prisma.account.create({
      data: {
        name,
        username,
        password_hash,
        role,
        is_active: true,
      },
    });

    await catatLog({
      account_id: session.id,
      aksi: 'buat',
      tabel_target: 'account',
      id_target: newAccount.id,
      nilai_baru: { name: newAccount.name, username: newAccount.username, role: newAccount.role },
    });

    return NextResponse.json({ data: newAccount }, { status: 201 });
  } catch (error) {
    console.error('Error create account:', error);
    return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 });
  }
}

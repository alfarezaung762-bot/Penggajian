import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { username },
    });

    if (!account || !account.is_active) {
      return NextResponse.json({ error: 'Akun tidak ditemukan atau tidak aktif' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, account.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    await createSession({
      id: account.id,
      username: account.username,
      name: account.name,
      role: account.role,
      account_id: account.id,
    });

    return NextResponse.json({
      data: {
        id: account.id,
        name: account.name,
        username: account.username,
        role: account.role,
      },
    });
  } catch (error) {
    console.error('Error login staff:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

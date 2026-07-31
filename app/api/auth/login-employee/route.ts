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

    const employee = await prisma.employee.findUnique({
      where: { username },
    });

    if (!employee || !employee.is_active) {
      return NextResponse.json({ error: 'Akun karyawan tidak ditemukan atau tidak aktif' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    await createSession({
      id: employee.id,
      username: employee.username,
      name: employee.name,
      role: 'karyawan',
      employee_id: employee.id,
    });

    return NextResponse.json({
      data: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        role: 'karyawan',
      },
    });
  } catch (error) {
    console.error('Error login employee:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { createEmployeeSchema } from '@/lib/validations/employee-schema';

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const employees = await prisma.employee.findMany({
    include: { jabatan: true },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: employees });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);

    const existingNik = await prisma.employee.findUnique({ where: { nik: validatedData.nik } });
    if (existingNik) {
      return NextResponse.json({ error: 'NIK sudah terdaftar' }, { status: 400 });
    }

    const existingUsername = await prisma.employee.findUnique({ where: { username: validatedData.username } });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username sudah terdaftar' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(validatedData.password, 10);
    const joinDate = new Date(validatedData.join_date);

    let tanggalNonaktifOtomatis: Date | null = null;
    if (validatedData.status_kepegawaian === 'kontrak' && validatedData.durasi_kontrak_bulan) {
      tanggalNonaktifOtomatis = new Date(joinDate);
      tanggalNonaktifOtomatis.setMonth(tanggalNonaktifOtomatis.getMonth() + validatedData.durasi_kontrak_bulan);
    }

    const newEmployee = await prisma.employee.create({
      data: {
        nik: validatedData.nik,
        name: validatedData.name,
        username: validatedData.username,
        password_hash,
        gender: validatedData.gender,
        jabatan_id: validatedData.jabatan_id,
        join_date: joinDate,
        status_pernikahan: validatedData.status_pernikahan,
        jumlah_tanggungan: validatedData.jumlah_tanggungan,
        bank_account_number: validatedData.bank_account_number,
        status_kepegawaian: validatedData.status_kepegawaian,
        durasi_kontrak_bulan: validatedData.durasi_kontrak_bulan ?? null,
        tanggal_nonaktif_otomatis: tanggalNonaktifOtomatis,
        photo_url: validatedData.photo_url ?? null,
        is_active: true,
      },
    });

    // Inisialisasi saldo cuti tahunan
    const currentYear = new Date().getFullYear();
    const pengumum = await prisma.saldo_cuti.upsert({
      where: {
        employee_id_tahun: {
          employee_id: newEmployee.id,
          tahun: currentYear,
        },
      },
      update: {},
      create: {
        employee_id: newEmployee.id,
        tahun: currentYear,
        kuota: 12,
        terpakai: 0,
      },
    });

    return NextResponse.json({ data: newEmployee }, { status: 201 });
  } catch (error: any) {
    console.error('Error create employee:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0]?.message || 'Input tidak valid' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat data karyawan' }, { status: 500 });
  }
}

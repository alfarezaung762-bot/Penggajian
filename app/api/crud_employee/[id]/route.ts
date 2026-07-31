import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);

  // Karyawan hanya boleh melihat datanya sendiri, HRD/Admin boleh melihat siapapun
  if (session.role === 'karyawan' && session.employee_id !== empId) {
    return NextResponse.json({ error: 'Akses ditolak (IDOR Prevented)' }, { status: 403 });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: empId },
    include: { jabatan: true },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ data: employee });
}

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
    const body = await request.json();
    const existing = await prisma.employee.findUnique({ where: { id: empId } });
    if (!existing) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.gender) updateData.gender = body.gender;
    if (body.jabatan_id) updateData.jabatan_id = body.jabatan_id;
    if (body.status_pernikahan) updateData.status_pernikahan = body.status_pernikahan;
    if (body.jumlah_tanggungan !== undefined) updateData.jumlah_tanggungan = body.jumlah_tanggungan;
    if (body.bank_account_number) updateData.bank_account_number = body.bank_account_number;
    if (body.status_kepegawaian) updateData.status_kepegawaian = body.status_kepegawaian;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    if (body.status_kepegawaian === 'kontrak' && body.durasi_kontrak_bulan) {
      updateData.durasi_kontrak_bulan = body.durasi_kontrak_bulan;
      const joinDate = existing.join_date;
      const nonaktifDate = new Date(joinDate);
      nonaktifDate.setMonth(nonaktifDate.getMonth() + body.durasi_kontrak_bulan);
      updateData.tanggal_nonaktif_otomatis = nonaktifDate;
    }

    const updated = await prisma.employee.update({
      where: { id: empId },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error update employee:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data karyawan' }, { status: 500 });
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
  const empId = parseInt(id, 10);

  try {
    const updated = await prisma.employee.update({
      where: { id: empId },
      data: { is_active: false },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error nonaktifkan employee:', error);
    return NextResponse.json({ error: 'Gagal menonaktifkan karyawan' }, { status: 500 });
  }
}

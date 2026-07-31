import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { catatLog } from '@/lib/log-aktivitas';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const jabatanList = await prisma.jabatan.findMany({
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: jabatanList });
}

export async function POST(request: Request) {
  const session = await getSession();
  // Pola maker-checker: HRD adalah maker (write)
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { nama, gaji_pokok, tunjangan_jabatan, uang_makan } = await request.json();

    if (!nama || gaji_pokok === undefined) {
      return NextResponse.json({ error: 'Nama jabatan dan gaji pokok wajib diisi' }, { status: 400 });
    }

    const newJabatan = await prisma.jabatan.create({
      data: {
        nama,
        gaji_pokok: parseFloat(gaji_pokok),
        tunjangan_jabatan: tunjangan_jabatan ? parseFloat(tunjangan_jabatan) : 0,
        uang_makan: uang_makan ? parseFloat(uang_makan) : 0,
      },
    });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'buat',
        tabel_target: 'jabatan',
        id_target: newJabatan.id,
        nilai_baru: { nama, gaji_pokok, tunjangan_jabatan, uang_makan },
      });
    }

    return NextResponse.json({ data: newJabatan }, { status: 201 });
  } catch (error) {
    console.error('Error create jabatan:', error);
    return NextResponse.json({ error: 'Gagal membuat data jabatan' }, { status: 500 });
  }
}

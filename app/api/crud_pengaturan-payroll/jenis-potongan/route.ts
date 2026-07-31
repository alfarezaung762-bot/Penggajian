import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { catatLog } from '@/lib/log-aktivitas';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const potonganList = await prisma.jenis_potongan.findMany({
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({ data: potonganList });
}

export async function POST(request: Request) {
  const session = await getSession();
  // Maker-checker: HRD can create potongan directly
  if (!session || (session.role !== 'hrd' && session.role !== 'admin_owner')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { nama, kategori, mode_hitung, tipe_nilai, nilai_default, status_aktif } = await request.json();

    if (!nama || !kategori || !mode_hitung || !tipe_nilai) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap' }, { status: 400 });
    }

    const newPotongan = await prisma.jenis_potongan.create({
      data: {
        nama,
        kategori,
        mode_hitung,
        tipe_nilai,
        nilai_default: nilai_default ? parseFloat(nilai_default) : 0,
        status_aktif: status_aktif !== undefined ? status_aktif : true,
      },
    });

    if (session.account_id) {
      await catatLog({
        account_id: session.account_id,
        aksi: 'buat',
        tabel_target: 'jenis_potongan',
        id_target: newPotongan.id,
        nilai_baru: { nama, kategori, mode_hitung, tipe_nilai, nilai_default, status_aktif },
      });
    }

    return NextResponse.json({ data: newPotongan }, { status: 201 });
  } catch (error) {
    console.error('Error create jenis potongan:', error);
    return NextResponse.json({ error: 'Gagal membuat jenis potongan' }, { status: 500 });
  }
}

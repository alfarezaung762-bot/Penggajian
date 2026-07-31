import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const jenis = searchParams.get('jenis');
  const status = searchParams.get('status');

  const whereClause: any = {};
  if (session.role === 'karyawan') {
    whereClause.employee_id = session.employee_id;
  }
  if (jenis) whereClause.jenis = jenis;
  if (status) whereClause.status = status;

  const pengajuanList = await prisma.pengajuan.findMany({
    where: whereClause,
    include: { employee: true, account: true },
    orderBy: { diajukan_pada: 'desc' },
  });

  return NextResponse.json({ data: pengajuanList });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan' || !session.employee_id) {
    return NextResponse.json({ error: 'Akses ditolak (khusus Karyawan)' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      jenis,
      tanggal_mulai_cuti,
      tanggal_selesai_cuti,
      alasan_cuti,
      tanggal_sakit,
      tanggal_lembur,
      jam_mulai_lembur,
      jam_selesai_lembur,
      foto_bukti_url,
    } = body;

    if (!jenis || !['cuti', 'sakit', 'lembur'].includes(jenis)) {
      return NextResponse.json({ error: 'Jenis pengajuan tidak valid' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validasi H-4 untuk Cuti dan Lembur
    if (jenis === 'cuti' || jenis === 'lembur') {
      const targetDateStr = jenis === 'cuti' ? tanggal_mulai_cuti : tanggal_lembur;
      if (!targetDateStr) {
        return NextResponse.json({ error: 'Tanggal pengajuan wajib diisi' }, { status: 400 });
      }

      const targetDate = new Date(targetDateStr);
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 4) {
        return NextResponse.json(
          { error: `Pengajuan ${jenis} wajib dilakukan minimal H-4 (4 hari sebelum tanggal yang diajukan)` },
          { status: 400 }
        );
      }
    }

    // Validasi kuota cuti jika jenis cuti
    if (jenis === 'cuti') {
      if (!tanggal_mulai_cuti || !tanggal_selesai_cuti) {
        return NextResponse.json({ error: 'Tanggal mulai dan selesai cuti wajib diisi' }, { status: 400 });
      }

      const startDate = new Date(tanggal_mulai_cuti);
      const endDate = new Date(tanggal_selesai_cuti);
      const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const year = startDate.getFullYear();
      const saldoCuti = await prisma.saldo_cuti.findUnique({
        where: {
          employee_id_tahun: {
            employee_id: session.employee_id,
            tahun: year,
          },
        },
      });

      const sisaKuota = saldoCuti ? saldoCuti.kuota - saldoCuti.terpakai : 12;
      if (daysCount > sisaKuota) {
        return NextResponse.json(
          { error: `Jumlah cuti (${daysCount} hari) melebihi sisa kuota cuti Anda (${sisaKuota} hari)` },
          { status: 400 }
        );
      }
    }

    // Hitung total menit lembur jika jenis lembur
    let totalMenitLembur: number | null = null;
    let jamMulaiDate: Date | null = null;
    let jamSelesaiDate: Date | null = null;

    if (jenis === 'lembur') {
      if (!jam_mulai_lembur || !jam_selesai_lembur || !tanggal_lembur) {
        return NextResponse.json({ error: 'Tanggal, jam mulai, dan jam selesai lembur wajib diisi' }, { status: 400 });
      }

      jamMulaiDate = new Date(`1970-01-01T${jam_mulai_lembur}:00Z`);
      jamSelesaiDate = new Date(`1970-01-01T${jam_selesai_lembur}:00Z`);
      totalMenitLembur = Math.round((jamSelesaiDate.getTime() - jamMulaiDate.getTime()) / (1000 * 60));
      if (totalMenitLembur <= 0) {
        return NextResponse.json({ error: 'Jam selesai lembur harus lebih besar dari jam mulai' }, { status: 400 });
      }
    }

    if (jenis === 'sakit' && !foto_bukti_url) {
      return NextResponse.json({ error: 'Pengajuan sakit wajib mengupload surat keterangan dokter' }, { status: 400 });
    }

    const created = await prisma.pengajuan.create({
      data: {
        employee_id: session.employee_id,
        jenis,
        tanggal_mulai_cuti: tanggal_mulai_cuti ? new Date(tanggal_mulai_cuti) : null,
        tanggal_selesai_cuti: tanggal_selesai_cuti ? new Date(tanggal_selesai_cuti) : null,
        alasan_cuti: alasan_cuti ?? null,
        tanggal_sakit: tanggal_sakit ? new Date(tanggal_sakit) : null,
        tanggal_lembur: tanggal_lembur ? new Date(tanggal_lembur) : null,
        jam_mulai_lembur: jamMulaiDate,
        jam_selesai_lembur: jamSelesaiDate,
        total_menit_lembur: totalMenitLembur,
        foto_bukti_url: foto_bukti_url ?? null,
        status: 'menunggu',
        diajukan_pada: new Date(),
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('Error create pengajuan:', error);
    return NextResponse.json({ error: 'Gagal membuat pengajuan' }, { status: 500 });
  }
}

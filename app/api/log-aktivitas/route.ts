import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin_owner') {
    return NextResponse.json({ error: 'Akses ditolak (khusus Admin/Owner)' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const account_id = searchParams.get('account_id');
  const aksi = searchParams.get('aksi');
  const tabel_target = searchParams.get('tabel_target');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const preset = searchParams.get('preset');

  const whereClause: any = {};

  if (account_id) {
    whereClause.account_id = parseInt(account_id, 10);
  }

  if (aksi) {
    whereClause.aksi = aksi;
  }

  if (tabel_target) {
    whereClause.tabel_target = tabel_target;
  }

  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at.gte = new Date(startDate);
    if (endDate) whereClause.created_at.lte = new Date(endDate);
  }

  // Preset "Perubahan Gaji & Jabatan": tabel_target IN ('jabatan', 'jenis_potongan') dan aksi = 'ubah'
  if (preset === 'perubahan_gaji_jabatan') {
    whereClause.tabel_target = { in: ['jabatan', 'jenis_potongan'] };
    whereClause.aksi = 'ubah';
  }

  const logs = await prisma.log_aktivitas.findMany({
    where: whereClause,
    include: { account: true },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  return NextResponse.json({ data: logs });
}

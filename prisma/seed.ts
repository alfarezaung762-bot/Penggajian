import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial database data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Accounts (HRD & Admin/Owner)
  const admin = await prisma.account.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin Utama',
      username: 'admin',
      password_hash: passwordHash,
      role: 'admin_owner',
      is_active: true,
    },
  });

  const hrd = await prisma.account.upsert({
    where: { username: 'hrd' },
    update: {},
    create: {
      name: 'HRD Manager',
      username: 'hrd',
      password_hash: passwordHash,
      role: 'hrd',
      is_active: true,
    },
  });

  console.log('Accounts created:', admin.username, hrd.username);

  // 2. Master Jabatan
  const managerJabatan = await prisma.jabatan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nama: 'Manager Operasional',
      gaji_pokok: 12000000,
      tunjangan_jabatan: 3000000,
      uang_makan: 1000000,
    },
  });

  const staffJabatan = await prisma.jabatan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nama: 'Staff IT / Developer',
      gaji_pokok: 7000000,
      tunjangan_jabatan: 1000000,
      uang_makan: 500000,
    },
  });

  console.log('Jabatan created:', managerJabatan.nama, staffJabatan.nama);

  // 3. Employee Test
  const employee1 = await prisma.employee.upsert({
    where: { username: 'budi' },
    update: {},
    create: {
      nik: '3201123456780001',
      name: 'Budi Santoso',
      username: 'budi',
      password_hash: passwordHash,
      gender: 'L',
      jabatan_id: staffJabatan.id,
      join_date: new Date('2024-01-15'),
      status_pernikahan: 'K',
      jumlah_tanggungan: 1,
      bank_account_number: '0123456789',
      status_kepegawaian: 'tetap',
      is_active: true,
    },
  });

  // Saldo Cuti
  await prisma.saldo_cuti.upsert({
    where: {
      employee_id_tahun: {
        employee_id: employee1.id,
        tahun: 2026,
      },
    },
    update: {},
    create: {
      employee_id: employee1.id,
      tahun: 2026,
      kuota: 12,
      terpakai: 0,
    },
  });

  console.log('Employee created:', employee1.name);

  // 4. Jadwal Kerja Mingguan
  const hariList: Array<{ hari: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'; jamMasuk: string | null; jamPulang: string | null }> = [
    { hari: 'senin', jamMasuk: '1970-01-01T08:00:00Z', jamPulang: '1970-01-01T17:00:00Z' },
    { hari: 'selasa', jamMasuk: '1970-01-01T08:00:00Z', jamPulang: '1970-01-01T17:00:00Z' },
    { hari: 'rabu', jamMasuk: '1970-01-01T08:00:00Z', jamPulang: '1970-01-01T17:00:00Z' },
    { hari: 'kamis', jamMasuk: '1970-01-01T08:00:00Z', jamPulang: '1970-01-01T17:00:00Z' },
    { hari: 'jumat', jamMasuk: '1970-01-01T08:00:00Z', jamPulang: '1970-01-01T17:00:00Z' },
    { hari: 'sabtu', jamMasuk: null, jamPulang: null },
    { hari: 'minggu', jamMasuk: null, jamPulang: null },
  ];

  for (const item of hariList) {
    await prisma.jadwal_kerja.upsert({
      where: { hari: item.hari },
      update: {},
      create: {
        hari: item.hari,
        jam_masuk: item.jamMasuk ? new Date(item.jamMasuk) : null,
        jam_pulang: item.jamPulang ? new Date(item.jamPulang) : null,
        toleransi_telat_menit: 15,
      },
    });
  }

  // 5. Tarif Lembur
  const countLemburKerja = await prisma.tarif_lembur.count({ where: { tipe_hari: 'kerja' } });
  if (countLemburKerja === 0) {
    await prisma.tarif_lembur.create({ data: { tipe_hari: 'kerja', multiplier: 1.5 } });
  }

  const countLemburLibur = await prisma.tarif_lembur.count({ where: { tipe_hari: 'libur' } });
  if (countLemburLibur === 0) {
    await prisma.tarif_lembur.create({ data: { tipe_hari: 'libur', multiplier: 2.0 } });
  }

  // 6. Jenis Potongan
  const potonganData = [
    { nama: 'BPJS Kesehatan', kategori: 'bpjs', mode_hitung: 'manual', tipe_nilai: 'persen', nilai_default: 1.0, status_aktif: true },
    { nama: 'Jaminan Hari Tua (JHT)', kategori: 'bpjs', mode_hitung: 'manual', tipe_nilai: 'persen', nilai_default: 2.0, status_aktif: true },
    { nama: 'Jaminan Pensiun (JP)', kategori: 'bpjs', mode_hitung: 'manual', tipe_nilai: 'persen', nilai_default: 1.0, status_aktif: true },
    { nama: 'PPh 21 (Pajak)', kategori: 'pajak', mode_hitung: 'otomatis', tipe_nilai: 'nominal', nilai_default: 0, status_aktif: true },
    { nama: 'Potongan Alpha', kategori: 'kehadiran', mode_hitung: 'otomatis', tipe_nilai: 'nominal', nilai_default: 0, status_aktif: true },
    { nama: 'Potongan Sakit', kategori: 'kehadiran', mode_hitung: 'manual', tipe_nilai: 'nominal', nilai_default: 0, status_aktif: false },
  ];

  for (const pot of potonganData) {
    const exists = await prisma.jenis_potongan.findFirst({ where: { nama: pot.nama } });
    if (!exists) {
      await prisma.jenis_potongan.create({
        data: {
          nama: pot.nama,
          kategori: pot.kategori as any,
          mode_hitung: pot.mode_hitung as any,
          tipe_nilai: pot.tipe_nilai as any,
          nilai_default: pot.nilai_default,
          status_aktif: pot.status_aktif,
        },
      });
    }
  }

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

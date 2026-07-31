import { prisma } from '../prisma';
import { calculatePPh21Monthly } from './pph21-service';
import { calculateNominalLembur } from './lembur-service';
import { calculatePotonganAlpha } from './absensi-service';

export interface GeneratePayrollParams {
  bulan: number; // 1-12
  tahun: number;
  account_id: number;
}

export async function generatePayrollPeriod(params: GeneratePayrollParams) {
  const { bulan, tahun, account_id } = params;

  // 1. Cek atau buat periode_penggajian
  let periode = await prisma.periode_penggajian.findUnique({
    where: { bulan_tahun: { bulan, tahun } },
  });

  if (periode && periode.status === 'terkunci') {
    throw new Error('Periode penggajian ini sudah terkunci dan tidak dapat di-generate ulang.');
  }

  if (!periode) {
    periode = await prisma.periode_penggajian.create({
      data: {
        bulan,
        tahun,
        status: 'draft',
      },
    });
  }

  // 2. Ambil seluruh karyawan aktif
  const employees = await prisma.employee.findMany({
    where: { is_active: true },
    include: { jabatan: true },
  });

  // 3. Ambil tarif lembur & tunjangan lain
  const tarifLemburKerja = await prisma.tarif_lembur.findFirst({ where: { tipe_hari: 'kerja' } });
  const tarifLemburLibur = await prisma.tarif_lembur.findFirst({ where: { tipe_hari: 'libur' } });

  const multKerja = tarifLemburKerja ? Number(tarifLemburKerja.multiplier) : 1.5;
  const multLibur = tarifLemburLibur ? Number(tarifLemburLibur.multiplier) : 2.0;

  // Master jenis_potongan aktif
  const jenisPotonganList = await prisma.jenis_potongan.findMany({
    where: { status_aktif: true },
  });

  // Master hari libur di bulan ini
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0);

  const hariLiburList = await prisma.hari_libur.findMany({
    where: {
      tanggal: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  const hariLiburDates = new Set(hariLiburList.map((h) => h.tanggal.toISOString().split('T')[0]));

  const generatedSlips = [];

  for (const emp of employees) {
    const gajiPokok = Number(emp.jabatan.gaji_pokok);
    const tunjanganJabatan = Number(emp.jabatan.tunjangan_jabatan);
    const uangMakan = Number(emp.jabatan.uang_makan);

    // Calculate Lembur
    const pengajuanLembur = await prisma.pengajuan.findMany({
      where: {
        employee_id: emp.id,
        jenis: 'lembur',
        status: 'disetujui',
        tanggal_lembur: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalLemburNominal = 0;
    for (const lembur of pengajuanLembur) {
      if (!lembur.tanggal_lembur || !lembur.total_menit_lembur) continue;
      const dateStr = lembur.tanggal_lembur.toISOString().split('T')[0];
      const dayOfWeek = lembur.tanggal_lembur.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekendOrLibur = dayOfWeek === 0 || dayOfWeek === 6 || hariLiburDates.has(dateStr);
      const mult = isWeekendOrLibur ? multLibur : multKerja;

      totalLemburNominal += calculateNominalLembur(gajiPokok, lembur.total_menit_lembur, mult);
    }

    // Calculate Tunjangan Lain
    const tunjanganLainList = await prisma.tunjangan_lain.findMany({
      where: {
        status_aktif: true,
        tanggal_pencairan: {
          gte: startDate,
          lte: endDate,
        },
        OR: [{ jabatan_id: emp.jabatan_id }, { jabatan_id: null }],
      },
    });

    const totalTunjanganLain = tunjanganLainList.reduce((acc, t) => acc + Number(t.nominal), 0);

    // Calculate Potongan
    const slipDetails: { nama_komponen: string; tipe: 'tambahan' | 'potongan'; nominal: number }[] = [];
    let totalPotonganNominal = 0;

    // Hitung Alpha
    const totalAlphaCount = await prisma.absensi.count({
      where: {
        employee_id: emp.id,
        status: 'alpha',
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const gajiBrutoBulanan = gajiPokok + tunjanganJabatan + uangMakan + totalLemburNominal + totalTunjanganLain;

    for (const pot of jenisPotonganList) {
      let nominalPot = 0;

      if (pot.mode_hitung === 'manual') {
        if (pot.tipe_nilai === 'persen') {
          nominalPot = Math.round(gajiPokok * (Number(pot.nilai_default) / 100));
        } else {
          nominalPot = Number(pot.nilai_default);
        }
      } else {
        // Otomatis
        if (pot.kategori === 'pajak') {
          nominalPot = calculatePPh21Monthly(gajiBrutoBulanan, emp.status_pernikahan, emp.jumlah_tanggungan);
        } else if (pot.kategori === 'kehadiran') {
          nominalPot = calculatePotonganAlpha(gajiPokok, totalAlphaCount, pot.tipe_nilai, Number(pot.nilai_default));
        }
      }

      if (nominalPot > 0) {
        totalPotonganNominal += nominalPot;
        slipDetails.push({
          nama_komponen: pot.nama,
          tipe: 'potongan',
          nominal: nominalPot,
        });
      }
    }

    const gajiBersih = Math.max(0, gajiBrutoBulanan - totalPotonganNominal);

    // Simpan atau update slip_gaji
    const existingSlip = await prisma.slip_gaji.findUnique({
      where: {
        periode_penggajian_id_employee_id: {
          periode_penggajian_id: periode.id,
          employee_id: emp.id,
        },
      },
    });

    let slipId: number;

    if (existingSlip) {
      slipId = existingSlip.id;
      await prisma.slip_gaji.update({
        where: { id: slipId },
        data: {
          gaji_pokok: gajiPokok,
          tunjangan_jabatan: tunjanganJabatan,
          uang_makan: uangMakan,
          total_lembur: totalLemburNominal,
          total_tunjangan_lain: totalTunjanganLain,
          total_potongan: totalPotonganNominal,
          gaji_bersih: gajiBersih,
        },
      });

      // Reset details
      await prisma.slip_gaji_detail.deleteMany({ where: { slip_gaji_id: slipId } });
    } else {
      const createdSlip = await prisma.slip_gaji.create({
        data: {
          periode_penggajian_id: periode.id,
          employee_id: emp.id,
          gaji_pokok: gajiPokok,
          tunjangan_jabatan: tunjanganJabatan,
          uang_makan: uangMakan,
          total_lembur: totalLemburNominal,
          total_tunjangan_lain: totalTunjanganLain,
          total_potongan: totalPotonganNominal,
          gaji_bersih: gajiBersih,
        },
      });
      slipId = createdSlip.id;
    }

    // Insert details
    if (slipDetails.length > 0) {
      await prisma.slip_gaji_detail.createMany({
        data: slipDetails.map((d) => ({
          slip_gaji_id: slipId,
          tipe: d.tipe,
          nama_komponen: d.nama_komponen,
          nominal: d.nominal,
        })),
      });
    }

    generatedSlips.push(slipId);
  }

  return { periodeId: periode.id, totalGenerated: generatedSlips.length };
}

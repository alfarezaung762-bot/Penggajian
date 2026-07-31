import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generateSlipGajiPDF } from '@/lib/services/pdf-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const slipId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    const slip = await prisma.slip_gaji.findUnique({
      where: { id: slipId },
      include: {
        periode_penggajian: true,
        employee: { include: { jabatan: true } },
        slip_gaji_detail: true,
      },
    });

    if (!slip) {
      return NextResponse.json({ error: 'Slip gaji tidak ditemukan' }, { status: 404 });
    }

    // IDOR & Lock check
    if (session.role === 'karyawan') {
      if (session.employee_id !== slip.employee_id) {
        return NextResponse.json({ error: 'Akses ditolak (IDOR Prevented)' }, { status: 403 });
      }
      if (slip.periode_penggajian.status !== 'terkunci') {
        return NextResponse.json({ error: 'Slip gaji periode ini belum difinalisasi (dikunci)' }, { status: 403 });
      }
    }

    if (format === 'pdf') {
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const bulanStr = monthNames[slip.periode_penggajian.bulan - 1];

      const pdfBuffer = await generateSlipGajiPDF({
        periode: `${bulanStr} ${slip.periode_penggajian.tahun}`,
        employee: {
          nik: slip.employee.nik,
          name: slip.employee.name,
          jabatan: slip.employee.jabatan.nama,
          status: slip.employee.status_kepegawaian.toUpperCase(),
          bankAccount: slip.employee.bank_account_number,
        },
        gajiPokok: Number(slip.gaji_pokok),
        tunjanganJabatan: Number(slip.tunjangan_jabatan),
        uangMakan: Number(slip.uang_makan),
        totalLembur: Number(slip.total_lembur),
        totalTunjanganLain: Number(slip.total_tunjangan_lain),
        totalPotongan: Number(slip.total_potongan),
        gajiBersih: Number(slip.gaji_bersih),
        details: slip.slip_gaji_detail.map((d) => ({
          namaKomponen: d.nama_komponen,
          tipe: d.tipe as 'tambahan' | 'potongan',
          nominal: Number(d.nominal),
        })),
      });

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Slip_Gaji_${slip.employee.name.replace(/\s+/g, '_')}_${bulanStr}_${slip.periode_penggajian.tahun}.pdf"`,
        },
      });
    }

    return NextResponse.json({ data: slip });
  } catch (err: any) {
    console.error('Error generating PDF slip:', err);
    return NextResponse.json({ error: err.message || 'Error generating PDF' }, { status: 500 });
  }
}

// @ts-ignore - standalone bundle includes pre-built fonts without filesystem AFM dependencies
import PDFDocument from 'pdfkit/js/pdfkit.standalone';

export interface SlipGajiPDFData {
  periode: string; // e.g. "Agustus 2026"
  employee: {
    nik: string;
    name: string;
    jabatan: string;
    status: string;
    bankAccount: string;
  };
  gajiPokok: number;
  tunjanganJabatan: number;
  uangMakan: number;
  totalLembur: number;
  totalTunjanganLain: number;
  totalPotongan: number;
  gajiBersih: number;
  details: {
    namaKomponen: string;
    tipe: 'tambahan' | 'potongan';
    nominal: number;
  }[];
}

export function generateSlipGajiPDF(data: SlipGajiPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err: Error) => reject(err));

    // Header Company
    doc.fontSize(18).font('Helvetica-Bold').text('PT PENGGAJIAN INDONESIA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('SLIP GAJI KARYAWAN', { align: 'center' });
    doc.fontSize(9).text(`Periode: ${data.periode}`, { align: 'center' });
    doc.moveDown(1.5);

    // Employee Metadata Box
    doc.fontSize(10).font('Helvetica-Bold').text('INFORMASI KARYAWAN');
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');
    
    doc.text(`NIK             : ${data.employee.nik}`);
    doc.text(`Nama            : ${data.employee.name}`);
    doc.text(`Jabatan         : ${data.employee.jabatan}`);
    doc.text(`Status          : ${data.employee.status}`);
    doc.text(`No. Rekening BNI: ${data.employee.bankAccount}`);
    doc.moveDown(1.5);

    // Rincian Penghasilan & Potongan Table Header
    doc.fontSize(10).font('Helvetica-Bold').text('RINCIAN GAJI & TUNJANGAN');
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');

    const formatRp = (num: number) => `Rp ${Math.round(num).toLocaleString('id-ID')}`;

    doc.text(`1. Gaji Pokok               : ${formatRp(data.gajiPokok)}`);
    doc.text(`2. Tunjangan Jabatan        : ${formatRp(data.tunjanganJabatan)}`);
    doc.text(`3. Uang Makan               : ${formatRp(data.uangMakan)}`);
    doc.text(`4. Total Lembur             : ${formatRp(data.totalLembur)}`);
    doc.text(`5. Total Tunjangan Lain     : ${formatRp(data.totalTunjanganLain)}`);

    if (data.details.length > 0) {
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica-Bold').text('RINCIAN POTONGAN & KOMPONEN TAMBAHAN');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      data.details.forEach((item, index) => {
        const tipeLabel = item.tipe === 'tambahan' ? '(+) Tambahan' : '(-) Potongan';
        doc.text(`${index + 1}. ${item.namaKomponen} (${tipeLabel}): ${formatRp(item.nominal)}`);
      });
    }

    doc.moveDown(1.5);
    doc.fontSize(10).font('Helvetica-Bold').text(`TOTAL POTONGAN: ${formatRp(data.totalPotongan)}`, { align: 'right' });
    doc.fontSize(12).font('Helvetica-Bold').text(`GAJI BERSIH (TAKE HOME PAY): ${formatRp(data.gajiBersih)}`, { align: 'right' });

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica-Oblique').text('Dokumen ini dibuat otomatis oleh Sistem Penggajian berbasis Web dan sah tanpa tanda tangan basah.', { align: 'center' });

    doc.end();
  });
}

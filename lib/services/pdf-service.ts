/**
 * Service Template & Generator Slip Gaji PDF
 * Mengacu pada Bagian 2.1 & 8.7 Dokumen Alur Sistem
 */

export interface SlipGajiPDFData {
  namaPerusahaan: string
  periodeBulan: string
  periodeTahun: number
  nik: string
  namaKaryawan: string
  jabatan: string
  statusKepegawaian: string
  gajiPokok: number
  tunjanganJabatan: number
  uangMakan: number
  tunjanganLain: number
  totalLembur: number
  totalGajiKotor: number
  potonganBPJS: number
  potonganPPh21: number
  statusPTKP?: string
  potonganAlpha: number
  potonganLain: number
  totalPotongan: number
  gajiBersih: number
  tanggalCetak: string
}

export function generateSlipGajiHTML(data: SlipGajiPDFData): string {
  const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Slip Gaji - ${data.namaKaryawan} (${data.periodeBulan} ${data.periodeTahun})</title>
      <style>
        body { font-family: sans-serif; margin: 0; padding: 24px; color: #0f172a; font-size: 13px; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 2px 0 0 0; color: #64748b; font-size: 12px; }
        .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 12px; }
        .grid-info td { padding: 3px 0; }
        .table-section { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-section th { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
        .table-section td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .total-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-rounded: 8px; margin-top: 16px; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
        .signature-box { width: 180px; }
        .signature-space { height: 60px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${data.namaPerusahaan}</h2>
        <p>SLIP GAJI KARYAWAN — PERIODE ${data.periodeBulan.toUpperCase()} ${data.periodeTahun}</p>
      </div>

      <table class="grid-info" style="width: 100%;">
        <tr>
          <td><strong>NIK:</strong> ${data.nik}</td>
          <td><strong>Jabatan:</strong> ${data.jabatan}</td>
        </tr>
        <tr>
          <td><strong>Nama:</strong> ${data.namaKaryawan}</td>
          <td><strong>Status:</strong> ${data.statusKepegawaian}</td>
        </tr>
      </table>

      <table class="table-section">
        <thead>
          <tr>
            <th>Penerimaan (Pendapatan)</th>
            <th class="text-right">Nominal</th>
            <th>Potongan</th>
            <th class="text-right">Nominal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gaji Pokok</td>
            <td class="text-right">${formatRp(data.gajiPokok)}</td>
            <td>Potongan BPJS</td>
            <td class="text-right">${formatRp(data.potonganBPJS)}</td>
          </tr>
          <tr>
            <td>Tunjangan Jabatan (Tanggung Jawab & Struktural)</td>
            <td class="text-right">${formatRp(data.tunjanganJabatan)}</td>
            <td>Potongan PPh 21 (Status PTKP: ${data.statusPTKP || 'TK/0'})</td>
            <td class="text-right">${formatRp(data.potonganPPh21)}</td>
          </tr>
          <tr>
            <td>Uang Makan</td>
            <td class="text-right">${formatRp(data.uangMakan)}</td>
            <td>Potongan Ketidakhadiran (Alpha)</td>
            <td class="text-right">${formatRp(data.potonganAlpha)}</td>
          </tr>
          <tr>
            <td>Upah Lembur</td>
            <td class="text-right">${formatRp(data.totalLembur)}</td>
            <td>Potongan Lainnya</td>
            <td class="text-right">${formatRp(data.potonganLain)}</td>
          </tr>
          <tr>
            <td>Tunjangan Lainnya (THR/Bonus)</td>
            <td class="text-right">${formatRp(data.tunjanganLain)}</td>
            <td></td>
            <td></td>
          </tr>
          <tr class="font-bold" style="background: #f8fafc;">
            <td>Total Pendapatan Kotor</td>
            <td class="text-right">${formatRp(data.totalGajiKotor)}</td>
            <td>Total Potongan</td>
            <td class="text-right">${formatRp(data.totalPotongan)}</td>
          </tr>
        </tbody>
      </table>

      <div class="total-box font-bold" style="display: flex; justify-content: space-between; font-size: 15px; background: #0f172a; color: #ffffff; padding: 12px 16px; border-radius: 8px;">
        <span>TAKE HOME PAY (GAJI BERSIH):</span>
        <span>${formatRp(data.gajiBersih)}</span>
      </div>

      <div class="footer">
        <div class="signature-box">
          <p>Penerima,</p>
          <div class="signature-space"></div>
          <p><strong>(${data.namaKaryawan})</strong></p>
        </div>
        <div class="signature-box">
          <p>Manajer HRD & Finance,</p>
          <div class="signature-space"></div>
          <p><strong>( PT SANTOSO MAKMUR JAYA )</strong></p>
        </div>
      </div>
    </body>
    </html>
  `
}

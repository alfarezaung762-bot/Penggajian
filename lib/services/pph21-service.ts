/**
 * Service Kalkulasi PTKP dan PPh 21 Karyawan
 * Mengacu pada Bagian 3, Poin 4 Dokumen Alur Sistem
 */

const PTKP_BASE = 54000000 // TK/0 = Rp 54.000.000 per tahun
const PTKP_KAWIN_ADD = 4500000 // Tambahan status menikah = Rp 4.500.000 per tahun
const PTKP_TANGGUNGAN_ADD = 4500000 // Tambahan per tanggungan (maks 3) = Rp 4.500.000 per tahun

export interface PPh21Input {
  gajiBrutoBulanan: number
  statusPernikahan: string // 'menikah' | 'lajang' | 'duda_janda'
  jumlahTanggungan: number
}

export function hitungPTKP(statusPernikahan: string, jumlahTanggungan: number): number {
  let ptkp = PTKP_BASE
  if (statusPernikahan === 'menikah') {
    ptkp += PTKP_KAWIN_ADD
  }
  const tanggunganEfektif = Math.min(Math.max(0, jumlahTanggungan), 3)
  ptkp += tanggunganEfektif * PTKP_TANGGUNGAN_ADD
  return ptkp
}

export function hitungPPh21Bulanan(input: PPh21Input): number {
  const { gajiBrutoBulanan, statusPernikahan, jumlahTanggungan } = input

  // Biaya Jabatan 5% dari Gaji Bruto (Maks Rp 500.000 per bulan)
  const biayaJabatan = Math.min(gajiBrutoBulanan * 0.05, 500000)
  const netoBulanan = gajiBrutoBulanan - biayaJabatan
  const netoTahunan = netoBulanan * 12

  const ptkp = hitungPTKP(statusPernikahan, jumlahTanggungan)
  const pkp = Math.max(0, netoTahunan - ptkp)

  if (pkp <= 0) return 0

  // Lapisan PPh 21 Progresif Tahunan
  let pajakTahunan = 0
  let sisaPkp = pkp

  // Lapisan 1: 5% (0 s/d 60 juta)
  const lap1 = Math.min(sisaPkp, 60000000)
  pajakTahunan += lap1 * 0.05
  sisaPkp -= lap1

  // Lapisan 2: 15% (60 juta s/d 250 juta)
  if (sisaPkp > 0) {
    const lap2 = Math.min(sisaPkp, 190000000)
    pajakTahunan += lap2 * 0.15
    sisaPkp -= lap2
  }

  // Lapisan 3: 25% (250 juta s/d 500 juta)
  if (sisaPkp > 0) {
    const lap3 = Math.min(sisaPkp, 250000000)
    pajakTahunan += lap3 * 0.25
    sisaPkp -= lap3
  }

  // Lapisan 4: 30% (> 500 juta)
  if (sisaPkp > 0) {
    pajakTahunan += sisaPkp * 0.30
  }

  // Pajak Bulanan
  return Math.round(pajakTahunan / 12)
}

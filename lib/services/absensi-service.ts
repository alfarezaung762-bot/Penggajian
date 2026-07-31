/**
 * Service Kalkulasi Potongan Alpha / Absensi
 */

export function calculatePotonganAlpha(
  gajiPokok: number,
  jumlahHariAlpha: number,
  modeTipe: 'nominal' | 'persen' = 'nominal',
  nilaiDefault: number = 0
): number {
  if (jumlahHariAlpha <= 0) return 0;

  if (nilaiDefault > 0) {
    if (modeTipe === 'persen') {
      return Math.round((gajiPokok * (nilaiDefault / 100)) * jumlahHariAlpha);
    }
    return Math.round(nilaiDefault * jumlahHariAlpha);
  }

  // Fallback standar: upah harian (gaji pokok / 22 hari kerja)
  const upahHarian = gajiPokok / 22;
  return Math.round(upahHarian * jumlahHariAlpha);
}

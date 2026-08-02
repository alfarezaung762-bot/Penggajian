import { describe, it, expect } from 'vitest'

// Helper penentu status presensi berdasarkan jam masuk dan toleransi
function tentukanStatusPresensi(
  jamMasukJadwal: string, // '08:00'
  jamPresensiRiil: string, // '08:14'
  toleransiMenit: number // 15
): 'hadir' | 'telat' {
  const [hJadwal, mJadwal] = jamMasukJadwal.split(':').map(Number)
  const [hRiil, mRiil] = jamPresensiRiil.split(':').map(Number)

  const totalMenitJadwal = hJadwal * 60 + mJadwal
  const totalMenitRiil = hRiil * 60 + mRiil
  const batasToleransi = totalMenitJadwal + toleransiMenit

  return totalMenitRiil <= batasToleransi ? 'hadir' : 'telat'
}

describe('Jadwal Kerja & Presensi Test Suite', () => {
  it('harus menetapkan status "hadir" jika presensi tepat pada jam masuk (08:00)', () => {
    expect(tentukanStatusPresensi('08:00', '08:00', 15)).toBe('hadir')
  })

  it('harus menetapkan status "hadir" jika presensi dalam batas toleransi (08:14)', () => {
    expect(tentukanStatusPresensi('08:00', '08:14', 15)).toBe('hadir')
  })

  it('harus menetapkan status "telat" jika presensi melewati batas toleransi (08:16)', () => {
    expect(tentukanStatusPresensi('08:00', '08:16', 15)).toBe('telat')
  })
})

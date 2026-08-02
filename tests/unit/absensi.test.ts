import { describe, it, expect } from 'vitest'

describe('Absensi & Denda Alpha Test Suite', () => {
  it('harus menghitung denda 1 hari alpha sebagai 1/25 gaji pokok', () => {
    const gajiPokok = 5000000
    const totalAlpha = 1
    const dendaPerHari = gajiPokok / 25
    const totalDenda = totalAlpha * dendaPerHari
    expect(totalDenda).toBe(200000)
  })

  it('harus menghitung denda 2 hari alpha sebagai 2 * (gaji pokok / 25)', () => {
    const gajiPokok = 6000000
    const totalAlpha = 2
    const dendaPerHari = gajiPokok / 25
    const totalDenda = totalAlpha * dendaPerHari
    expect(totalDenda).toBe(480000)
  })
})

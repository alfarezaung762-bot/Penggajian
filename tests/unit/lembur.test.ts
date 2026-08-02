import { describe, it, expect } from 'vitest'

describe('Overtime Engine Math Test Suite', () => {
  it('harus menghitung upah per jam dasar 1/173 dari gaji pokok', () => {
    const gajiPokok = 5190000
    const upahPerJam = gajiPokok / 173
    expect(upahPerJam).toBe(30000)
  })

  it('harus menghitung nominal lembur hari kerja dengan multiplier 1.5x', () => {
    const gajiPokok = 5190000
    const jamLembur = 2
    const multiplier = 1.5
    const nominal = jamLembur * (gajiPokok / 173) * multiplier
    expect(nominal).toBe(90000)
  })

  it('harus menghitung nominal lembur hari libur dengan multiplier 2.0x', () => {
    const gajiPokok = 5190000
    const jamLembur = 4
    const multiplier = 2.0
    const nominal = jamLembur * (gajiPokok / 173) * multiplier
    expect(nominal).toBe(240000)
  })
})

import { describe, it, expect } from 'vitest'
import { hitungPTKP, hitungPPh21Bulanan } from '@/lib/services/pph21-service'

describe('PPh 21 Engine Test Suite', () => {
  it('harus menghitung PTKP TK/0 dengan benar (Rp 54 Juta)', () => {
    const ptkp = hitungPTKP('TK', 0)
    expect(ptkp).toBe(54000000)
  })

  it('harus menghitung PTKP K/1 dengan benar (Rp 63 Juta)', () => {
    const ptkp = hitungPTKP('menikah', 1)
    expect(ptkp).toBe(63000000)
  })

  it('harus menghitung PPh 21 Karyawan A (Gaji 6 Juta, TK/0) = Rp 60.000 / bulan', () => {
    const pph = hitungPPh21Bulanan({
      gajiBrutoBulanan: 6000000,
      statusPernikahan: 'TK',
      jumlahTanggungan: 0,
    })
    expect(pph).toBe(60000)
  })

  it('harus menghitung PPh 21 Karyawan B (Gaji 6 Juta, K/1) = Rp 22.500 / bulan', () => {
    const pph = hitungPPh21Bulanan({
      gajiBrutoBulanan: 6000000,
      statusPernikahan: 'menikah',
      jumlahTanggungan: 1,
    })
    expect(pph).toBe(22500)
  })
})

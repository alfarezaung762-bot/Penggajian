import { describe, it, expect } from 'vitest'

// Helper function simulasi pengurangan saldo cuti tahunan
function hitungSisaKuotaCuti(kuotaAwal: number, terpakai: number, diajukan: number): {
  isEligible: boolean
  sisaAkhir: number
} {
  const sisaSaatIni = kuotaAwal - terpakai
  if (diajukan > sisaSaatIni) {
    return { isEligible: false, sisaAkhir: sisaSaatIni }
  }
  return { isEligible: true, sisaAkhir: sisaSaatIni - diajukan }
}

describe('Saldo & Kuota Cuti Test Suite', () => {
  it('harus menyetujui pengajuan 3 hari jika kuota sisa 12 hari', () => {
    const result = hitungSisaKuotaCuti(12, 0, 3)
    expect(result.isEligible).toBe(true)
    expect(result.sisaAkhir).toBe(9)
  })

  it('harus menolak pengajuan 5 hari jika sisa kuota tinggal 2 hari', () => {
    const result = hitungSisaKuotaCuti(12, 10, 5)
    expect(result.isEligible).toBe(false)
    expect(result.sisaAkhir).toBe(2)
  })

  it('harus menghabiskan kuota hingga 0 jika sisa 4 hari dan diajukan 4 hari', () => {
    const result = hitungSisaKuotaCuti(12, 8, 4)
    expect(result.isEligible).toBe(true)
    expect(result.sisaAkhir).toBe(0)
  })
})

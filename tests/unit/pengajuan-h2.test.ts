import { describe, it, expect } from 'vitest'

// Helper function untuk validasi H-2 pengajuan (Cuti & Lembur) vs Sakit
function isPengajuanValidH2(jenis: 'cuti' | 'sakit' | 'lembur', tanggalPengajuan: Date, tanggalPelaksanaan: Date): boolean {
  if (jenis === 'sakit') return true // Sakit darurat, boleh diajukan H-0 / kapan saja

  const tglPengajuan = new Date(tanggalPengajuan)
  tglPengajuan.setHours(0, 0, 0, 0)

  const tglPelaksanaan = new Date(tanggalPelaksanaan)
  tglPelaksanaan.setHours(0, 0, 0, 0)

  const diffMs = tglPelaksanaan.getTime() - tglPengajuan.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return diffDays >= 2
}

describe('Validasi H-2 Pengajuan Test Suite', () => {
  it('harus menerima pengajuan cuti yang diajukan H-3 sebelum pelaksanaan', () => {
    const pengajuan = new Date('2026-08-01')
    const pelaksanaan = new Date('2026-08-04')
    expect(isPengajuanValidH2('cuti', pengajuan, pelaksanaan)).toBe(true)
  })

  it('harus menerima pengajuan lembur yang diajukan tepat H-2 sebelum pelaksanaan', () => {
    const pengajuan = new Date('2026-08-01')
    const pelaksanaan = new Date('2026-08-03')
    expect(isPengajuanValidH2('lembur', pengajuan, pelaksanaan)).toBe(true)
  })

  it('harus menolak pengajuan cuti yang diajukan H-1 (terlalu mendadak)', () => {
    const pengajuan = new Date('2026-08-01')
    const pelaksanaan = new Date('2026-08-02')
    expect(isPengajuanValidH2('cuti', pengajuan, pelaksanaan)).toBe(false)
  })

  it('harus menerima pengajuan sakit pada hari yang sama (H-0/darurat)', () => {
    const pengajuan = new Date('2026-08-01')
    const pelaksanaan = new Date('2026-08-01')
    expect(isPengajuanValidH2('sakit', pengajuan, pelaksanaan)).toBe(true)
  })
})

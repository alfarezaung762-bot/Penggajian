import { describe, it, expect } from 'vitest'
import { createEmployeeSchema } from '@/lib/validations/employee-schema'

describe('Zod Validation Schemas Test Suite', () => {
  it('harus lolos validasi jika data karyawan lengkap dan benar', () => {
    const validData = {
      jabatan_id: 1,
      nik: '3201123456789012',
      name: 'Budi Santoso',
      username: 'budis',
      password: 'password123',
      gender: 'L',
      join_date: '2026-01-01',
      status_pernikahan: 'TK',
      jumlah_tanggungan: 0,
      bank_account_number: '1234567890',
      status_kepegawaian: 'tetap',
    }
    const result = createEmployeeSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('harus menolak NIK yang kurang dari 16 digit (misal 15 digit)', () => {
    const invalidData = {
      jabatan_id: 1,
      nik: '123456789012345',
      name: 'Budi Santoso',
      username: 'budis',
      password: 'password123',
      gender: 'L',
      join_date: '2026-01-01',
      status_pernikahan: 'TK',
      jumlah_tanggungan: 0,
      bank_account_number: '1234567890',
      status_kepegawaian: 'tetap',
    }
    const result = createEmployeeSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('harus menolak nomor rekening BNI yang bukan 10 digit', () => {
    const invalidData = {
      jabatan_id: 1,
      nik: '3201123456789012',
      name: 'Budi Santoso',
      username: 'budis',
      password: 'password123',
      gender: 'L',
      join_date: '2026-01-01',
      status_pernikahan: 'TK',
      jumlah_tanggungan: 0,
      bank_account_number: '123456',
      status_kepegawaian: 'tetap',
    }
    const result = createEmployeeSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('harus menolak status kepegawaian "kontrak" jika durasi_kontrak_bulan kosong', () => {
    const invalidData = {
      jabatan_id: 1,
      nik: '3201123456789012',
      name: 'Siti Rahma',
      username: 'sitir',
      password: 'password123',
      gender: 'P',
      join_date: '2026-01-01',
      status_pernikahan: 'K',
      jumlah_tanggungan: 1,
      bank_account_number: '1234567890',
      status_kepegawaian: 'kontrak',
    }
    const result = createEmployeeSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

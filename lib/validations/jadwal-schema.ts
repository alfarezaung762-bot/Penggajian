import { z } from 'zod'

export const updateJadwalKerjaSchema = z.object({
  hari: z.enum(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']),
  jam_masuk: z.string().nullable().optional(),
  jam_pulang: z.string().nullable().optional(),
  toleransi_telat_menit: z.number().int().min(0).max(60).default(15),
})

export const createHariLiburSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi').max(200),
})

export type UpdateJadwalKerjaInput = z.infer<typeof updateJadwalKerjaSchema>
export type CreateHariLiburInput = z.infer<typeof createHariLiburSchema>

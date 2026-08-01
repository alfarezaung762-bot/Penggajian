import { z } from 'zod'

export const updateTarifLemburSchema = z.object({
  tipe_hari: z.enum(['kerja', 'libur']),
  multiplier: z.number().min(0.1).max(10),
})

export const createTunjanganLainSchema = z.object({
  nama: z.string().min(1, 'Nama tunjangan wajib diisi').max(100),
  nominal: z.number().min(0, 'Nominal harus positif'),
  jabatan_target_id: z.number().int().nullable().optional(),
  tanggal_pencairan: z.string().min(1, 'Tanggal pencairan wajib diisi'),
  status_aktif: z.boolean().optional().default(true),
})

export const updateTunjanganLainSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  nominal: z.number().min(0).optional(),
  jabatan_target_id: z.number().int().nullable().optional(),
  tanggal_pencairan: z.string().optional(),
  status_aktif: z.boolean().optional(),
})

export type UpdateTarifLemburInput = z.infer<typeof updateTarifLemburSchema>
export type CreateTunjanganLainInput = z.infer<typeof createTunjanganLainSchema>
export type UpdateTunjanganLainInput = z.infer<typeof updateTunjanganLainSchema>

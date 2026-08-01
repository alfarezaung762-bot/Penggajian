import * as z from 'zod'

export const createPotonganSchema = z.object({
  nama: z.string()
    .min(2, { error: 'Nama potongan minimal 2 karakter' })
    .max(100, { error: 'Nama potongan maksimal 100 karakter' }),
  kategori: z.enum(['bpjs', 'pajak', 'kehadiran', 'kustom'], {
    error: 'Kategori harus bpjs, pajak, kehadiran, atau kustom',
  }),
  mode_hitung: z.enum(['otomatis', 'manual'], {
    error: 'Mode hitung harus otomatis atau manual',
  }),
  tipe_nilai: z.enum(['nominal', 'persen'], {
    error: 'Tipe nilai harus nominal atau persen',
  }),
  nilai_default: z.number()
    .min(0, { error: 'Nilai default tidak boleh negatif' })
    .nullable()
    .optional(),
  status_aktif: z.boolean().optional().default(true),
})

export const updatePotonganSchema = createPotonganSchema.partial()

export type CreatePotonganInput = z.infer<typeof createPotonganSchema>
export type UpdatePotonganInput = z.infer<typeof updatePotonganSchema>

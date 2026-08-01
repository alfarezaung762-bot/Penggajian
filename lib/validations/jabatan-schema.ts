import * as z from 'zod'

export const createJabatanSchema = z.object({
  nama: z.string()
    .min(2, { error: 'Nama jabatan minimal 2 karakter' })
    .max(150, { error: 'Nama jabatan maksimal 150 karakter' }),
  gaji_pokok: z.number()
    .min(0, { error: 'Gaji pokok tidak boleh negatif' })
    .max(999999999999999, { error: 'Gaji pokok melebihi batas' }),
  tunjangan_jabatan: z.number()
    .min(0, { error: 'Tunjangan jabatan tidak boleh negatif' })
    .max(999999999999999, { error: 'Tunjangan jabatan melebihi batas' })
    .optional()
    .default(0),
  uang_makan: z.number()
    .min(0, { error: 'Uang makan tidak boleh negatif' })
    .max(999999999999999, { error: 'Uang makan melebihi batas' })
    .optional()
    .default(0),
})

export const updateJabatanSchema = createJabatanSchema.partial()

export type CreateJabatanInput = z.infer<typeof createJabatanSchema>
export type UpdateJabatanInput = z.infer<typeof updateJabatanSchema>

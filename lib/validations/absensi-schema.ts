import * as z from 'zod'

export const absensiMasukSchema = z.object({
  foto: z.string().min(1, { error: 'Foto wajib diambil untuk absensi masuk' }),
  sumber_foto: z.enum(['kamera', 'galeri'], {
    error: 'Sumber foto harus kamera atau galeri',
  }),
})

export const absensiPulangSchema = z.object({
  foto: z.string().min(1, { error: 'Foto wajib diambil untuk absensi pulang' }),
  sumber_foto: z.enum(['kamera', 'galeri'], {
    error: 'Sumber foto harus kamera atau galeri',
  }),
})

export const koreksiAbsensiSchema = z.object({
  status: z.enum(['hadir', 'telat', 'alpha', 'sakit', 'cuti', 'libur'], {
    error: 'Status absensi tidak valid',
  }),
  catatan_alasan: z.string()
    .min(5, { error: 'Alasan koreksi minimal 5 karakter' })
    .max(10000, { error: 'Alasan koreksi maksimal 10000 karakter' }),
})

export type AbsensiMasukInput = z.infer<typeof absensiMasukSchema>
export type AbsensiPulangInput = z.infer<typeof absensiPulangSchema>
export type KoreksiAbsensiInput = z.infer<typeof koreksiAbsensiSchema>

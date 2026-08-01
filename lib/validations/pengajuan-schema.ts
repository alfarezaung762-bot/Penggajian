import * as z from 'zod'

const basePengajuanSchema = z.object({
  jenis: z.enum(['cuti', 'sakit', 'lembur'], {
    error: 'Jenis pengajuan harus cuti, sakit, atau lembur',
  }),
})

export const pengajuanCutiSchema = basePengajuanSchema.extend({
  jenis: z.literal('cuti'),
  tanggal_mulai_cuti: z.string().min(1, { error: 'Tanggal mulai cuti wajib diisi' }),
  tanggal_selesai_cuti: z.string().min(1, { error: 'Tanggal selesai cuti wajib diisi' }),
  alasan_cuti: z.string()
    .min(5, { error: 'Alasan cuti minimal 5 karakter' })
    .max(10000, { error: 'Alasan cuti maksimal 10000 karakter' }),
}).refine(
  (data) => new Date(data.tanggal_selesai_cuti) >= new Date(data.tanggal_mulai_cuti),
  {
    error: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai',
    path: ['tanggal_selesai_cuti'],
  }
)

export const pengajuanSakitSchema = basePengajuanSchema.extend({
  jenis: z.literal('sakit'),
  tanggal_sakit: z.string().min(1, { error: 'Tanggal sakit wajib diisi' }),
  foto_bukti: z.string().min(1, { error: 'Foto surat keterangan dokter wajib diupload' }),
})

export const pengajuanLemburSchema = basePengajuanSchema.extend({
  jenis: z.literal('lembur'),
  tanggal_lembur: z.string({ error: 'Tanggal lembur wajib diisi' }).min(1, { error: 'Tanggal lembur wajib diisi' }),
  jam_mulai_lembur: z.string({ error: 'Jam mulai lembur wajib diisi' }).min(1, { error: 'Jam mulai lembur wajib diisi' }),
  jam_selesai_lembur: z.string({ error: 'Jam selesai lembur wajib diisi' }).min(1, { error: 'Jam selesai lembur wajib diisi' }),
  foto_bukti: z.string({ error: 'Foto bukti lembur wajib diupload' }).min(1, { error: 'Foto bukti lembur wajib diupload' }),
}).refine(
  (data) => data.jam_selesai_lembur > data.jam_mulai_lembur,
  {
    error: 'Jam selesai lembur harus setelah jam mulai lembur',
    path: ['jam_selesai_lembur'],
  }
)

export const pengajuanSchema = z.discriminatedUnion('jenis', [
  pengajuanCutiSchema,
  pengajuanSakitSchema,
  pengajuanLemburSchema,
])

export const prosesPengajuanSchema = z.object({
  status: z.enum(['disetujui', 'ditolak'], {
    error: 'Status harus disetujui atau ditolak',
  }),
  catatan_penolakan: z.string()
    .max(10000, { error: 'Catatan maksimal 10000 karakter' })
    .nullable()
    .optional(),
}).refine(
  (data) => {
    if (data.status === 'ditolak') {
      return data.catatan_penolakan && data.catatan_penolakan.trim().length > 0
    }
    return true
  },
  {
    error: 'Catatan penolakan wajib diisi jika ditolak',
    path: ['catatan_penolakan'],
  }
)

export type PengajuanInput = z.infer<typeof pengajuanSchema>
export type ProsesPengajuanInput = z.infer<typeof prosesPengajuanSchema>

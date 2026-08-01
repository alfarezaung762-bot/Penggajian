import * as z from 'zod'

export const createEmployeeSchema = z.object({
  jabatan_id: z.number({ error: 'Jabatan wajib dipilih' }).int().positive(),
  nik: z.string()
    .regex(/^[0-9]{16}$/, { error: 'NIK harus tepat 16 digit angka' }),
  name: z.string()
    .min(2, { error: 'Nama minimal 2 karakter' })
    .max(150, { error: 'Nama maksimal 150 karakter' }),
  username: z.string()
    .min(3, { error: 'Username minimal 3 karakter' })
    .max(150, { error: 'Username maksimal 150 karakter' }),
  password: z.string()
    .min(6, { error: 'Password minimal 6 karakter' })
    .max(100, { error: 'Password maksimal 100 karakter' }),
  gender: z.enum(['L', 'P'], {
    error: 'Jenis kelamin harus L atau P',
  }),
  join_date: z.string()
    .min(1, { error: 'Tanggal masuk wajib diisi' }),
  status_pernikahan: z.enum(['TK', 'K'], {
    error: 'Status pernikahan harus TK (Tidak Kawin) atau K (Kawin)',
  }),
  jumlah_tanggungan: z.number()
    .int()
    .min(0, { error: 'Jumlah tanggungan minimal 0' })
    .max(3, { error: 'Jumlah tanggungan maksimal 3' }),
  bank_account_number: z.string()
    .regex(/^[0-9]{10}$/, { error: 'Nomor rekening BNI harus tepat 10 digit angka' }),
  status_kepegawaian: z.enum(['tetap', 'kontrak'], {
    error: 'Status kepegawaian harus tetap atau kontrak',
  }),
  durasi_kontrak_bulan: z.number()
    .int()
    .min(1, { error: 'Durasi kontrak minimal 1 bulan' })
    .max(120, { error: 'Durasi kontrak maksimal 120 bulan' })
    .nullable()
    .optional(),
  photo_url: z.string().max(255).nullable().optional(),
}).refine(
  (data) => {
    if (data.status_kepegawaian === 'kontrak') {
      return data.durasi_kontrak_bulan != null && data.durasi_kontrak_bulan > 0
    }
    return true
  },
  {
    error: 'Durasi kontrak wajib diisi untuk karyawan kontrak',
    path: ['durasi_kontrak_bulan'],
  }
)

export const updateEmployeeSchema = z.object({
  jabatan_id: z.number().int().positive().optional(),
  nik: z.string()
    .regex(/^[0-9]{16}$/, { error: 'NIK harus tepat 16 digit angka' })
    .optional(),
  name: z.string()
    .min(2, { error: 'Nama minimal 2 karakter' })
    .max(150, { error: 'Nama maksimal 150 karakter' })
    .optional(),
  username: z.string()
    .min(3, { error: 'Username minimal 3 karakter' })
    .max(150, { error: 'Username maksimal 150 karakter' })
    .optional(),
  gender: z.enum(['L', 'P']).optional(),
  join_date: z.string().optional(),
  status_pernikahan: z.enum(['TK', 'K']).optional(),
  jumlah_tanggungan: z.number().int().min(0).max(3).optional(),
  bank_account_number: z.string()
    .regex(/^[0-9]{10}$/, { error: 'Nomor rekening BNI harus tepat 10 digit angka' })
    .optional(),
  status_kepegawaian: z.enum(['tetap', 'kontrak']).optional(),
  durasi_kontrak_bulan: z.number().int().min(1).max(120).nullable().optional(),
  is_active: z.boolean().optional(),
  photo_url: z.string().max(255).nullable().optional(),
})

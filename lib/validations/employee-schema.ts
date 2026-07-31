import { z } from 'zod';

export const createEmployeeSchema = z.object({
  nik: z.string().length(16, 'NIK harus tepat 16 digit').regex(/^[0-9]+$/, 'NIK harus berupa angka'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(150),
  username: z.string().min(3, 'Username minimal 3 karakter').max(150),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  gender: z.enum(['L', 'P']),
  jabatan_id: z.number().int().positive('Jabatan wajib dipilih'),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  status_pernikahan: z.enum(['TK', 'K']),
  jumlah_tanggungan: z.number().int().min(0).max(3),
  bank_account_number: z.string().length(10, 'Nomor rekening BNI harus 10 digit').regex(/^[0-9]+$/, 'Rekening harus angka'),
  status_kepegawaian: z.enum(['tetap', 'kontrak']),
  durasi_kontrak_bulan: z.number().int().positive().nullable().optional(),
  photo_url: z.string().nullable().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: true });

import { z } from 'zod';

export const clockInSchema = z.object({
  foto_masuk_url: z.string().optional(),
});

export const clockOutSchema = z.object({
  foto_pulang_url: z.string().optional(),
});

export const koreksiAbsensiSchema = z.object({
  status: z.enum(['hadir', 'telat', 'alpha', 'sakit', 'cuti', 'libur']),
  catatan_alasan: z.string().min(5, 'Alasan koreksi minimal 5 karakter').max(10000),
});

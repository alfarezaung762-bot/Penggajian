import { z } from 'zod';

export const createPengajuanSchema = z.object({
  jenis: z.enum(['cuti', 'sakit', 'lembur']),
  tanggal_mulai_cuti: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  tanggal_selesai_cuti: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  alasan_cuti: z.string().max(10000).nullable().optional(),
  tanggal_sakit: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  tanggal_lembur: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  jam_mulai_lembur: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  jam_selesai_lembur: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  foto_bukti_url: z.string().nullable().optional(),
});

export const prosesPengajuanSchema = z.object({
  status: z.enum(['disetujui', 'ditolak']),
  catatan_penolakan: z.string().max(10000).optional(),
});

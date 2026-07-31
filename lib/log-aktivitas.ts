import { prisma } from './prisma';
import { aksi_log } from '../app/generated/prisma/enums';

export interface CatatLogParams {
  account_id: number;
  aksi: aksi_log;
  tabel_target: string;
  id_target: number;
  nilai_lama?: any;
  nilai_baru?: any;
}

export async function catatLog(params: CatatLogParams) {
  try {
    return await prisma.log_aktivitas.create({
      data: {
        account_id: params.account_id,
        aksi: params.aksi,
        tabel_target: params.tabel_target,
        id_target: params.id_target,
        nilai_lama: params.nilai_lama ?? undefined,
        nilai_baru: params.nilai_baru ?? undefined,
      },
    });
  } catch (error) {
    console.error('Gagal mencatat log aktivitas:', error);
  }
}

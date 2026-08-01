import prisma from '@/lib/prisma'
import { aksi_log } from '@/app/generated/prisma/enums'

interface LogParams {
  accountId: number
  aksi: aksi_log
  tabelTarget: string
  idTarget: number
  nilaiLama?: Record<string, unknown>
  nilaiBaru?: Record<string, unknown>
}

export async function catatLog(params: LogParams) {
  try {
    await prisma.log_aktivitas.create({
      data: {
        account_id: params.accountId,
        aksi: params.aksi,
        tabel_target: params.tabelTarget,
        id_target: params.idTarget,
        nilai_lama: (params.nilaiLama ?? undefined) as any,
        nilai_baru: (params.nilaiBaru ?? undefined) as any,
      },
    })
  } catch (error) {
    console.error('Catat log error:', error)
  }
}

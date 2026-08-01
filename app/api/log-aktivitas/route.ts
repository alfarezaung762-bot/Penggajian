import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const url = request.nextUrl
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const aksi = url.searchParams.get('aksi')
  const tabel = url.searchParams.get('tabel')
  const accountId = url.searchParams.get('account_id')
  const startDate = url.searchParams.get('start_date') || url.searchParams.get('tanggal_mulai')
  const endDate = url.searchParams.get('end_date') || url.searchParams.get('tanggal_selesai')

  const where: Record<string, unknown> = {}

  if (aksi) {
    where.aksi = aksi
  }

  if (tabel) {
    if (tabel.includes(',')) {
      where.tabel_target = { in: tabel.split(',').map(t => t.trim()) }
    } else {
      where.tabel_target = tabel
    }
  }

  if (accountId) {
    where.account_id = parseInt(accountId)
  }

  if (startDate && endDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    where.created_at = { gte: start, lte: end }
  } else if (startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(startDate)
    end.setHours(23, 59, 59, 999)
    where.created_at = { gte: start, lte: end }
  }

  const [logs, total, accounts] = await Promise.all([
    prisma.log_aktivitas.findMany({
      where,
      include: { account: { select: { id: true, name: true, username: true, role: true } } },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.log_aktivitas.count({ where }),
    prisma.account.findMany({
      select: { id: true, name: true, username: true, role: true },
      orderBy: { name: 'asc' }
    })
  ])

  return successResponse({
    logs,
    accounts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

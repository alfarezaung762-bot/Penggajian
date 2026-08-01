import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  const url = request.nextUrl
  const employeeId = session.type === 'employee' ? session.id : parseInt(url.searchParams.get('employee_id') || '0')
  const tahun = parseInt(url.searchParams.get('tahun') || String(new Date().getFullYear()))

  if (!employeeId) return successResponse([])

  const saldo = await prisma.saldo_cuti.findMany({
    where: { employee_id: employeeId, tahun },
    orderBy: { tahun: 'desc' },
  })

  return successResponse(saldo)
}

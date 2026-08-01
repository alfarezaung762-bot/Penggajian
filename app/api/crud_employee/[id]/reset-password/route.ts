import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { resetPasswordSchema } from '@/lib/validations/auth-schema'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response'

// PATCH — reset password karyawan (HRD/Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()

  const { id } = await params
  const employeeId = parseInt(id)
  if (isNaN(employeeId)) return errorResponse('ID tidak valid')

  try {
    const existing = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!existing) return notFoundResponse('Karyawan tidak ditemukan')

    const body = await request.json()
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const hashedPassword = await bcrypt.hash(result.data.password_baru, 10)
    await prisma.employee.update({
      where: { id: employeeId },
      data: { password_hash: hashedPassword },
    })

    return successResponse({ message: 'Password karyawan berhasil direset' })
  } catch (error) {
    console.error('Reset password error:', error)
    return errorResponse('Gagal mereset password', 500)
  }
}

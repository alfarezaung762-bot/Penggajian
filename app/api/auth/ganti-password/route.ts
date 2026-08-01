import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { changePasswordSchema } from '@/lib/validations/auth-schema'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorizedResponse()

  try {
    const body = await request.json()
    const result = changePasswordSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    const { password_lama, password_baru } = result.data

    if (session.type === 'account') {
      const account = await prisma.account.findUnique({ where: { id: session.id } })
      if (!account) return errorResponse('Akun tidak ditemukan')

      const isValid = await bcrypt.compare(password_lama, account.password_hash)
      if (!isValid) return errorResponse('Password lama salah')

      const hashed = await bcrypt.hash(password_baru, 10)
      await prisma.account.update({ where: { id: session.id }, data: { password_hash: hashed } })
    } else {
      const employee = await prisma.employee.findUnique({ where: { id: session.id } })
      if (!employee) return errorResponse('Akun tidak ditemukan')

      const isValid = await bcrypt.compare(password_lama, employee.password_hash)
      if (!isValid) return errorResponse('Password lama salah')

      const hashed = await bcrypt.hash(password_baru, 10)
      await prisma.employee.update({ where: { id: session.id }, data: { password_hash: hashed } })
    }

    return successResponse({ message: 'Password berhasil diubah' })
  } catch (error) {
    console.error('Change password error:', error)
    return errorResponse('Gagal mengubah password', 500)
  }
}

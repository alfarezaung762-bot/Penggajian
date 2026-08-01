import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { updateAccountSchema } from '@/lib/validations/auth-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

// PATCH — edit akun (admin_owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  const { id } = await params
  const accountId = parseInt(id)
  if (isNaN(accountId)) return errorResponse('ID tidak valid')

  try {
    const existing = await prisma.account.findUnique({ where: { id: accountId } })
    if (!existing) return notFoundResponse('Akun tidak ditemukan')

    const body = await request.json()
    const result = updateAccountSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    // Cek username unik jika diubah
    if (result.data.username && result.data.username !== existing.username) {
      const dup = await prisma.account.findUnique({ where: { username: result.data.username } })
      if (dup) return errorResponse('Username sudah digunakan')
    }

    const updateData: Record<string, unknown> = { ...result.data }
    if (result.data.password) {
      updateData.password_hash = await bcrypt.hash(result.data.password, 10)
      delete updateData.password
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
      select: { id: true, name: true, username: true, role: true, is_active: true, created_at: true },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Update account error:', error)
    return errorResponse('Gagal mengubah akun', 500)
  }
}

// DELETE — nonaktifkan akun (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  const { id } = await params
  const accountId = parseInt(id)
  if (isNaN(accountId)) return errorResponse('ID tidak valid')

  if (accountId === session.id) return errorResponse('Tidak dapat menonaktifkan akun sendiri')

  try {
    const existing = await prisma.account.findUnique({ where: { id: accountId } })
    if (!existing) return notFoundResponse('Akun tidak ditemukan')

    await prisma.account.update({
      where: { id: accountId },
      data: { is_active: false },
    })

    return successResponse({ message: 'Akun berhasil dinonaktifkan' })
  } catch (error) {
    console.error('Delete account error:', error)
    return errorResponse('Gagal menonaktifkan akun', 500)
  }
}

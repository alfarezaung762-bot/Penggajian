import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createAccountSchema } from '@/lib/validations/auth-schema'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'

// GET — list semua akun (admin_owner only)
export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  const accounts = await prisma.account.findMany({
    select: { id: true, name: true, username: true, role: true, is_active: true, created_at: true },
    orderBy: { created_at: 'desc' },
  })

  return successResponse(accounts)
}

// POST — buat akun baru (admin_owner only)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.type !== 'account') return unauthorizedResponse()
  if (session.role !== 'admin_owner') return forbiddenResponse()

  try {
    const body = await request.json()
    const result = createAccountSchema.safeParse(body)
    if (!result.success) return errorResponse(result.error.issues[0]?.message || 'Input tidak valid')

    // Cek username unik
    const existing = await prisma.account.findUnique({ where: { username: result.data.username } })
    if (existing) return errorResponse('Username sudah digunakan')

    const hashedPassword = await bcrypt.hash(result.data.password, 10)

    const account = await prisma.account.create({
      data: {
        name: result.data.name,
        username: result.data.username,
        password_hash: hashedPassword,
        role: result.data.role as 'hrd' | 'admin_owner',
      },
      select: { id: true, name: true, username: true, role: true, is_active: true, created_at: true },
    })

    return successResponse(account, 201)
  } catch (error) {
    console.error('Create account error:', error)
    return errorResponse('Gagal membuat akun', 500)
  }
}

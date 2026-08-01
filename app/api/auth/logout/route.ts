import { destroySession } from '@/lib/session'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST() {
  try {
    await destroySession()
    return successResponse({ message: 'Berhasil logout' })
  } catch (error) {
    console.error('Logout error:', error)
    return errorResponse('Terjadi kesalahan saat logout', 500)
  }
}

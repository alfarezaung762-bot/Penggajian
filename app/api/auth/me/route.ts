import { getSession } from '@/lib/session'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return unauthorizedResponse()
  }

  return successResponse({
    id: session.id,
    role: session.role,
    type: session.type,
    name: session.name,
  })
}

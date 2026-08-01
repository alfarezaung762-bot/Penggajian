import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET || 'default-secret-change-in-production'
const encodedKey = new TextEncoder().encode(secretKey)

// Route publik yang tidak perlu autentikasi
const publicRoutes = ['/login']
const publicApiRoutes = ['/api/auth/login-staff', '/api/auth/login-employee']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lewati route publik
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Lewati API login
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Lewati cron endpoints (dilindungi oleh cron secret di production)
  if (pathname.startsWith('/api/cron')) {
    return NextResponse.next()
  }

  // Cek session cookie
  const session = request.cookies.get('session')?.value

  if (!session) {
    // Jika request API, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesi tidak valid. Silakan login kembali.' }, { status: 401 })
    }
    // Jika request halaman, redirect ke login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })

    // Tambahkan info user ke header untuk dipakai route handler
    const response = NextResponse.next()
    response.headers.set('x-user-id', String(payload.id))
    response.headers.set('x-user-role', String(payload.role))
    response.headers.set('x-user-type', String(payload.type))
    response.headers.set('x-user-name', String(payload.name))

    // Proteksi route karyawan — hanya role employee
    if (pathname.startsWith('/karyawan') && payload.type !== 'employee') {
      return NextResponse.redirect(new URL('/kelola_hrd_admin/data-karyawan', request.url))
    }

    // Proteksi route kelola — hanya role HRD/Admin
    if (pathname.startsWith('/kelola_hrd_admin') && payload.type !== 'account') {
      return NextResponse.redirect(new URL('/karyawan/absensi', request.url))
    }

    return response
  } catch {
    // Token invalid atau expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesi telah berakhir. Silakan login kembali.' }, { status: 401 })
    }

    // Hapus cookie yang invalid dan redirect ke login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

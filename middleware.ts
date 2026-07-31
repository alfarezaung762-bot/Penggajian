import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'super-secret-payroll-key-change-in-production-12345'
);

const COOKIE_NAME = 'penggajian_session';

const ADMIN_ONLY_PAGES = [
  '/kelola_hrd_admin/akun',
  '/kelola_hrd_admin/tarif-lembur',
  '/kelola_hrd_admin/tunjangan-lain',
  '/kelola_hrd_admin/pengaturan-umum',
  '/kelola_hrd_admin/payroll',
  '/kelola_hrd_admin/log-aktivitas',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets & api routes handled individually
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Allow login page
  if (pathname === '/login') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const role = payload.role as string;
        if (role === 'karyawan') {
          return NextResponse.redirect(new URL('/karyawan/absensi', request.url));
        } else {
          return NextResponse.redirect(new URL('/kelola_hrd_admin/data-karyawan', request.url));
        }
      } catch (e) {
        // Invalid token, proceed to login page
      }
    }
    return NextResponse.next();
  }

  // Protected route checking
  if (pathname.startsWith('/karyawan') || pathname.startsWith('/kelola_hrd_admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      const role = payload.role as string;

      if (pathname.startsWith('/karyawan') && role !== 'karyawan') {
        return NextResponse.redirect(new URL('/kelola_hrd_admin/data-karyawan', request.url));
      }

      if (pathname.startsWith('/kelola_hrd_admin')) {
        if (role !== 'hrd' && role !== 'admin_owner') {
          return NextResponse.redirect(new URL('/karyawan/absensi', request.url));
        }

        // Admin-only subpages
        if (ADMIN_ONLY_PAGES.some((page) => pathname.startsWith(page)) && role !== 'admin_owner') {
          return NextResponse.redirect(new URL('/kelola_hrd_admin/data-karyawan', request.url));
        }
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status })
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function unauthorizedResponse(message: string = 'Akses ditolak') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message: string = 'Anda tidak memiliki izin untuk aksi ini') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFoundResponse(message: string = 'Data tidak ditemukan') {
  return NextResponse.json({ error: message }, { status: 404 })
}

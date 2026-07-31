import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
  }

  return NextResponse.json({ data: session });
}

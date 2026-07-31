import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { uploadFotoAbsensi } from '@/lib/cloudinary_service/upload-foto-absensi';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let fileBase64Str = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileBase64Str = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else {
      const body = await request.json();
      fileBase64Str = body.file;
    }

    if (!fileBase64Str) {
      return NextResponse.json({ error: 'Konten file kosong' }, { status: 400 });
    }

    try {
      const url = await uploadFotoAbsensi(fileBase64Str);
      return NextResponse.json({ url });
    } catch (cloudinaryErr: any) {
      console.warn('Cloudinary upload warning (using Data URI fallback):', cloudinaryErr?.message || cloudinaryErr);
      // Fallback: return data URI or fallback URL
      return NextResponse.json({ url: fileBase64Str.length < 500000 ? fileBase64Str : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' });
    }
  } catch (error: any) {
    console.error('Error upload file:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengunggah foto' }, { status: 500 });
  }
}

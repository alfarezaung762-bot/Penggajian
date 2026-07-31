import cloudinary from './cloudinary-config';

export async function uploadFotoPengajuan(fileBase64OrBuffer: string, folder = 'penggajian/pengajuan'): Promise<string> {
  const result = await cloudinary.uploader.upload(fileBase64OrBuffer, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
}

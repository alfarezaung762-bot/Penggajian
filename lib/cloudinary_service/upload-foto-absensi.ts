import cloudinary from './cloudinary-config';

export async function uploadFotoAbsensi(fileBase64OrBuffer: string, folder = 'penggajian/absensi'): Promise<string> {
  const result = await cloudinary.uploader.upload(fileBase64OrBuffer, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
}

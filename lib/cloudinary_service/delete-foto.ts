import cloudinary from './cloudinary-config';

export async function deleteFoto(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Gagal menghapus foto dari Cloudinary:', error);
    return false;
  }
}

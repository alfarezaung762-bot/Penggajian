import cloudinary from './cloudinary-config'

export async function deleteFoto(publicIdOrUrl: string): Promise<void> {
  // Jika input berupa URL lengkap, ekstrak public_id
  let publicId = publicIdOrUrl

  if (publicIdOrUrl.startsWith('http')) {
    // Contoh URL: https://res.cloudinary.com/xxx/image/upload/v123/penggajian/profil/employee_1.jpg
    const urlParts = publicIdOrUrl.split('/upload/')
    if (urlParts[1]) {
      // Hapus version prefix (v123/) dan ekstensi file
      publicId = urlParts[1]
        .replace(/^v\d+\//, '')
        .replace(/\.[^.]+$/, '')
    }
  }

  await cloudinary.uploader.destroy(publicId)
}

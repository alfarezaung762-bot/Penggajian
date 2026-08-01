import fs from 'fs'
import path from 'path'
import cloudinary from './cloudinary-config'

export async function uploadFotoProfil(
  base64Data: string,
  employeeId: number
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `penggajian/profil`,
      public_id: `employee_${employeeId}`,
      overwrite: true,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    })
    return result.secure_url
  } catch (error) {
    console.warn('Cloudinary upload failed, falling back to local file storage:', error)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profil')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const fileName = `profil_${employeeId}_${Date.now()}.png`
      const filePath = path.join(uploadsDir, fileName)

      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(cleanBase64, 'base64')
      fs.writeFileSync(filePath, buffer)

      return `/uploads/profil/${fileName}`
    } catch (fsErr) {
      console.error('Local storage fallback error:', fsErr)
      return `/uploads/profil/default-avatar.png`
    }
  }
}

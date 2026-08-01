import fs from 'fs'
import path from 'path'
import cloudinary from './cloudinary-config'

export async function uploadFotoAbsensi(
  base64Data: string,
  employeeId: number,
  tipe: 'masuk' | 'pulang'
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `penggajian/absensi/${employeeId}`,
      public_id: `${tipe}_${Date.now()}`,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    })
    return result.secure_url
  } catch (error) {
    console.warn('Cloudinary upload failed, falling back to local file storage:', error)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'absensi')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const fileName = `absensi_${employeeId}_${tipe}_${Date.now()}.png`
      const filePath = path.join(uploadsDir, fileName)

      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(cleanBase64, 'base64')
      fs.writeFileSync(filePath, buffer)

      return `/uploads/absensi/${fileName}`
    } catch (fsErr) {
      console.error('Local storage fallback error:', fsErr)
      return `/uploads/absensi/default-absensi.png`
    }
  }
}

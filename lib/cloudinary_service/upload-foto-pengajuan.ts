import fs from 'fs'
import path from 'path'
import cloudinary from './cloudinary-config'

export async function uploadFotoPengajuan(
  base64Data: string,
  employeeId: number,
  jenis: 'sakit' | 'lembur'
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `penggajian/pengajuan/${employeeId}`,
      public_id: `${jenis}_${Date.now()}`,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    })
    return result.secure_url
  } catch (error) {
    console.warn('Cloudinary upload failed, falling back to local file storage:', error)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pengajuan')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const fileName = `pengajuan_${employeeId}_${jenis}_${Date.now()}.png`
      const filePath = path.join(uploadsDir, fileName)

      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(cleanBase64, 'base64')
      fs.writeFileSync(filePath, buffer)

      return `/uploads/pengajuan/${fileName}`
    } catch (fsErr) {
      console.error('Local storage fallback error:', fsErr)
      return `/uploads/pengajuan/default-bukti.png`
    }
  }
}

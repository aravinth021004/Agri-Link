import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { v2 as cloudinary } from 'cloudinary'

export interface UploadResult {
  url: string
  publicId: string
  type: 'image' | 'video'
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Ensure upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const storageMode = process.env.STORAGE_MODE || 'local'

  if (storageMode === 'cloudinary') {
    return uploadToCloudinary(file)
  }

  return uploadToLocal(file)
}

async function uploadToLocal(file: File): Promise<UploadResult> {
  ensureUploadDir()

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${uuidv4()}.${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)

  fs.writeFileSync(filepath, buffer)

  const isVideo = file.type.startsWith('video/')

  return {
    url: `/uploads/${filename}`,
    publicId: filename,
    type: isVideo ? 'video' : 'image',
  }
}

async function uploadToCloudinary(file: File): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary not configured, falling back to local storage')
    return uploadToLocal(file)
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }

  const isVideo = file.type.startsWith('video/')
  const resourceType = isVideo ? 'video' : 'image'

  // Convert buffer to base64 data URI
  const base64 = buffer.toString('base64')
  const dataUri = `data:${file.type};base64,${base64}`

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'agrilink',
      resource_type: resourceType,
      transformation: isVideo ? undefined : [
        { quality: 'auto', fetch_format: 'auto' }
      ],
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: isVideo ? 'video' : 'image',
    }
  } catch (error) {
    console.error('Cloudinary upload failed:', error)
    throw new Error('Failed to upload to Cloudinary')
  }
}

export async function deleteFile(publicId: string): Promise<void> {
  const storageMode = process.env.STORAGE_MODE || 'local'

  if (storageMode === 'cloudinary') {
    return deleteFromCloudinary(publicId)
  }

  return deleteFromLocal(publicId)
}

async function deleteFromLocal(filename: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, filename)
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
  }
}

async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete failed:', error)
  }
}

export function getFileUrl(url: string): string {
  // For local files, prefix with base URL if needed
  if (url.startsWith('/uploads/')) {
    return url
  }
  return url
}

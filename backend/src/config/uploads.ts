import multer from 'multer'
import fs from 'fs'
import path from 'path'

/**
 * Centralized multer upload configurations. Each export is a ready-to-use middleware
 * chain (e.g. `materialUpload.single('file')`). The destination directories are
 * created at module load so the upload handlers can write to them immediately.
 */

const ensureDir = (relative: string) => {
  const dir = path.join(process.cwd(), relative)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

ensureDir('uploads/courses')
ensureDir('uploads/avatars')
ensureDir('uploads/temp')

const COURSE_ALLOWED_MIMETYPES = new Set([
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint',                                              // ppt
  'video/mp4',
  'video/webm',
  'video/ogg',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
])

const IMAGE_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const TESTCASE_ALLOWED_EXTS = ['.in', '.out', '.ans', '.zip']

export const materialUpload = multer({
  dest: 'uploads/courses',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    COURSE_ALLOWED_MIMETYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('不支持的文件类型'))
  },
})

export const avatarUpload = multer({
  dest: 'uploads/avatars',
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    IMAGE_MIMETYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('仅支持 JPG/PNG/GIF/WebP'))
  },
})

export const testcaseUpload = multer({
  dest: 'uploads/temp',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase()
    TESTCASE_ALLOWED_EXTS.some(e => ext.endsWith(e))
      ? cb(null, true)
      : cb(new Error('仅支持 .in / .out / .ans / .zip 文件'))
  },
})

/** Multer instance used by the objective Excel import; the controller calls .single('file') on it. */
export const excelUpload = multer({
  dest: 'uploads/temp',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isXlsx = file.originalname.toLowerCase().endsWith('.xlsx') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    isXlsx ? cb(null, true) : cb(new Error('仅支持 .xlsx 文件'))
  },
})

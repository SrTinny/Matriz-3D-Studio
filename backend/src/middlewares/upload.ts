import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'

const productsUploadDir = path.resolve(__dirname, '../../uploads/products')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(productsUploadDir, { recursive: true })
    cb(null, productsUploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${base}${ext}`)
  },
})

export const productImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error('Apenas arquivos de imagem sao permitidos.'))
      return
    }
    cb(null, true)
  },
})

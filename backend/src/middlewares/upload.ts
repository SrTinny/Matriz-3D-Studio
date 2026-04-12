import path from 'node:path'
import multer from 'multer'

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error('Apenas arquivos de imagem sao permitidos.'))
      return
    }
    cb(null, true)
  },
})

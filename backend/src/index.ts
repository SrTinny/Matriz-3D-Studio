import './config/env'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import productRoutes from './modules/products/product.routes'
import categoryRoutes from './modules/categories/category.routes'
import authRoutes from './modules/auth/auth.routes'
import cartRoutes from './modules/cart/cart.routes'
import { errorHandler } from './middlewares/errorHandler'
import { env } from './config/env'

const app = express()
const port = env.port

if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')

app.use(express.json())
app.use(cookieParser())
app.use(helmet({ crossOriginResourcePolicy: false }))

/* ============== CORS ============== */
function parseAllowedOrigins(raw?: string) {
  if (!raw) return []

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

// Somente origens locais durante o desenvolvimento
const staticAllowed = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
].filter(Boolean)

const envAllowed = parseAllowedOrigins(env.frontendUrl)
const allowedOrigins = [...new Set([...staticAllowed, ...envAllowed])]

const vercelPreviewRe = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true) // curl/healthchecks
    if (allowedOrigins.includes(origin) || vercelPreviewRe.test(origin)) {
      return cb(null, true)
    }
    return cb(new Error(`Origin not allowed by CORS: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}

// ✅ Aplica CORS globalmente (inclui preflight nas rotas)
app.use(cors(corsOptions))

/* Rotas públicas */
app.use('/auth', authRoutes)

/* Rotas protegidas / públicas */
app.use('/products', productRoutes)
app.use('/categories', categoryRoutes)
app.use('/cart', cartRoutes)

app.get('/', (_req, res) => res.send('🚀 Servidor rodando com TypeScript!'))

// Handler de erro
app.use(errorHandler)

app.listen(port, () => console.log(`✅ Server rodando na porta ${port}`))

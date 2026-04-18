import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { Prisma, ProductTag } from '@prisma/client'

function emptyToUndefined(value: unknown) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function buildUploadedImageDataUrl(file: Express.Multer.File) {
  const mimeType = file.mimetype || 'image/jpeg'
  const base64 = file.buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}

/* ========= helpers ========= */
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function isPrismaKnownError(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function parseBooleanLike(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'on', 'yes'].includes(normalized)) return true
    if (['false', '0', 'off', 'no', ''].includes(normalized)) return false
  }
  return value
}

function numberOrUndefined(value: unknown) {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  wholesalePrice: true,
  weightGrams: true,
  printHours: true,
  wholesaleEnabled: true,
  stock: true,
  imageUrl: true,
  tag: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const

/* ========= Schemas ========= */
// use z.coerce para aceitar strings vindas do front
const createProductSchema = z.object({
  name: z.string().min(1, 'nome obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().finite('preço inválido'),
  wholesalePrice: z.preprocess(numberOrUndefined, z.coerce.number().finite().nonnegative().optional()),
  weightGrams: z.preprocess(numberOrUndefined, z.coerce.number().finite().nonnegative().default(0)),
  printHours: z.preprocess(numberOrUndefined, z.coerce.number().finite().nonnegative().default(0)),
  wholesaleEnabled: z.preprocess(parseBooleanLike, z.boolean().default(false)),
  stock: z.coerce.number().int().nonnegative().default(0),
  imageUrl: z.preprocess(emptyToUndefined, z.string().url('URL inválida').optional())
  ,
  tag: z.enum(['PROMOCAO', 'NOVO']).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  categoryName: z.string().optional().nullable(),
})

// Update sem defaults, só aplica o que vier
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.coerce.number().finite().optional(),
  wholesalePrice: z.preprocess(numberOrUndefined, z.coerce.number().finite().nonnegative().optional()),
  weightGrams: z.preprocess(numberOrUndefined, z.coerce.number().finite().nonnegative().optional()),
  printHours: z.preprocess(numberOrUndefined, z.coerce.number().finite().nonnegative().optional()),
  wholesaleEnabled: z.preprocess(parseBooleanLike, z.boolean().optional()),
  stock: z.coerce.number().int().nonnegative().optional(),
  imageUrl: z.preprocess(emptyToUndefined, z.string().url('URL inválida').nullable().optional())
  ,
  tag: z.enum(['PROMOCAO', 'NOVO']).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  categoryName: z.string().nullable().optional(),
})

/* ========= Handlers ========= */

export async function listProducts(req: Request, res: Response) {
  const pageRaw = Number(req.query.page ?? 1)
  const perPageRaw = Number(req.query.perPage ?? 10)
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const perPage = Math.min(Number.isFinite(perPageRaw) && perPageRaw > 0 ? perPageRaw : 10, 50)
  const search = String(req.query.search ?? '').trim()
  const sort = String(req.query.sort ?? 'relevance').trim()
  const category = String(req.query.category ?? '').trim()

  // build `where` dynamically to support search and a simple category filter
  const conditions: Prisma.ProductWhereInput[] = []
  if (search) {
    conditions.push({ name: { contains: search, mode: 'insensitive' as const } })
  }
  if (category) {
    // try to match an existing Category by slug or name; if found, filter by categoryId
    const catParam = String(category).trim()
    if (looksLikeUuid(catParam)) {
      conditions.push({ categoryId: catParam })
    } else {
    const catSlug = slugify(catParam)
    const foundCat = await prisma.category.findFirst({ where: { OR: [{ slug: catSlug }, { name: { equals: catParam, mode: 'insensitive' as const } }] } })
    if (foundCat) {
      conditions.push({ categoryId: foundCat.id })
    } else {
      // fallback: search in name/description
      conditions.push({
        OR: [
          { name: { contains: category, mode: 'insensitive' as const } },
          { description: { contains: category, mode: 'insensitive' as const } },
        ],
      })
    }
    }
  }

  let where: Prisma.ProductWhereInput = {}
  if (conditions.length === 1) where = conditions[0] ?? {}
  else if (conditions.length > 1) where = { AND: conditions } as Prisma.ProductWhereInput

  const orderBy: Prisma.ProductOrderByWithRelationInput = ((): Prisma.ProductOrderByWithRelationInput => {
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' }
      case 'price_desc':
        return { price: 'desc' }
      case 'name_asc':
        return { name: 'asc' }
      case 'name_desc':
        return { name: 'desc' }
      default:
        return { createdAt: 'desc' }
    }
  })()

  // debug: parâmetros recebidos e orderBy — removido em produção

  type SelectedProduct = {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    wholesalePrice: number | null
    weightGrams: number | null
    printHours: number | null
    wholesaleEnabled: boolean
    stock: number
    imageUrl: string | null
    tag: ProductTag | null
    categoryId: string | null
    category: { id: string; name: string } | null
    createdAt: Date
    updatedAt: Date
  }

  let items: SelectedProduct[] = []
  let total = 0

  // If ordering by name we fetch all matching rows and sort in JS using localeCompare
  // to avoid differences in DB collation. Then apply pagination slice.
  if (sort === 'name_asc' || sort === 'name_desc') {
    const all = await prisma.product.findMany({
      where,
      select: productSelect,
    })
    total = all.length
    all.sort((a, b) => {
      const cmp = String(a.name).localeCompare(String(b.name), 'pt-BR', { sensitivity: 'base' })
      return sort === 'name_asc' ? cmp : -cmp
    })
    const start = (page - 1) * perPage
    items = all.slice(start, start + perPage)
  } else {
    const [list, cnt] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
        select: productSelect,
      }),
      prisma.product.count({ where }),
    ])
    items = list
    total = cnt
  }

  // map enum tag to localized string for frontend
  const itemsMapped = items.map((it: SelectedProduct) => ({
    ...it,
    categoryName: it.category?.name ?? null,
    tag: it.tag === 'PROMOCAO' ? 'Promoção' : it.tag === 'NOVO' ? 'Novo' : undefined,
  }))

  res.json({ page, perPage, total, items: itemsMapped })
}

export async function getProduct(req: Request, res: Response) {
  const { id } = req.params

  const product = await prisma.product.findUnique({
    where: { id: String(id) },
    select: productSelect,
  })

  if (!product) return res.status(404).json({ message: 'Produto não encontrado' })
  res.json({
    ...product,
    categoryName: product.category?.name ?? null,
    tag: product.tag === 'PROMOCAO' ? 'Promoção' : product.tag === 'NOVO' ? 'Novo' : undefined,
  })
}

export async function createProduct(req: Request, res: Response) {
  const parsed = createProductSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() })
  }

  const data = parsed.data
  const uploadedImageUrl = req.file ? buildUploadedImageDataUrl(req.file) : undefined

  try {
    // handle free-text categoryName: find or create Category and set categoryId
    let categoryId: string | undefined
    const cnameRaw = data.categoryName
    if (cnameRaw) {
      const cname = String(cnameRaw).trim()
      if (cname) {
        const cslug = slugify(cname)
        let cat = await prisma.category.findUnique({ where: { slug: cslug } })
        if (!cat) {
          cat = await prisma.category.findFirst({ where: { name: { equals: cname, mode: 'insensitive' } } })
        }
        if (!cat) {
          cat = await prisma.category.create({ data: { name: cname, slug: cslug } })
        }
        categoryId = cat.id
      }
    }

    // build create payload and include categoryId only when defined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      name: data.name,
      slug: slugify(data.name),
      price: data.price,
      wholesalePrice: data.wholesaleEnabled ? data.wholesalePrice ?? null : null,
      weightGrams: data.weightGrams,
      printHours: data.printHours,
      wholesaleEnabled: data.wholesaleEnabled,
      stock: data.stock ?? 0,
      description: data.description ?? null,
      imageUrl: uploadedImageUrl ?? data.imageUrl ?? null,
      tag: data.tag ?? null,
    }
    if (categoryId) createData.categoryId = categoryId

    const created = await prisma.product.create({ data: createData, select: productSelect })

    res.status(201).json({
      ...created,
      categoryName: created.category?.name ?? null,
      tag: created.tag === 'PROMOCAO' ? 'Promoção' : created.tag === 'NOVO' ? 'Novo' : undefined,
    })
  } catch (e: unknown) {
    if (isPrismaKnownError(e) && e.code === 'P2002') {
      return res.status(409).json({ message: 'Produto já existe (slug/nome duplicado)' })
    }
    throw e
  }
}

export async function updateProduct(req: Request, res: Response) {
  const { id } = req.params

  const current = await prisma.product.findUnique({ where: { id: String(id) }, select: { id: true } })
  if (!current) return res.status(404).json({ message: 'Produto não encontrado' })

  const parsed = updateProductSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() })
  }
  const patch = parsed.data
  const uploadedImageUrl = req.file ? buildUploadedImageDataUrl(req.file) : undefined

  // aplica somente campos presentes
  const data: {
    name?: string
    price?: number
    wholesalePrice?: number | null
    weightGrams?: number | null
    printHours?: number | null
    wholesaleEnabled?: boolean
    stock?: number
    description?: string | null
    imageUrl?: string | null
    slug?: string
    tag?: 'PROMOCAO' | 'NOVO' | null
  } = {}

  if (patch.name !== undefined) {
    data.name = patch.name
    // se quiser atualizar o slug quando o nome mudar:
    data.slug = slugify(patch.name)
  }
  if (patch.price !== undefined) data.price = patch.price
  if (patch.wholesalePrice !== undefined) data.wholesalePrice = patch.wholesalePrice
  if (patch.weightGrams !== undefined) data.weightGrams = patch.weightGrams
  if (patch.printHours !== undefined) data.printHours = patch.printHours
  if (patch.wholesaleEnabled !== undefined) {
    data.wholesaleEnabled = patch.wholesaleEnabled
    if (patch.wholesaleEnabled === false) data.wholesalePrice = null
  }
  if (patch.stock !== undefined) data.stock = patch.stock
  if (patch.description !== undefined) data.description = patch.description ?? null
  if (uploadedImageUrl) data.imageUrl = uploadedImageUrl
  else if (patch.imageUrl !== undefined) data.imageUrl = patch.imageUrl ?? null
  if (patch.tag !== undefined) data.tag = patch.tag ?? null
  // handle categoryName in update: find/create category and set categoryId
  let updateCategoryId: string | undefined
  if (patch.categoryName !== undefined) {
    const cnameRaw = patch.categoryName
    if (cnameRaw) {
      const cname = String(cnameRaw).trim()
      if (cname) {
        const cslug = slugify(cname)
        let cat = await prisma.category.findUnique({ where: { slug: cslug } })
        if (!cat) {
          cat = await prisma.category.findFirst({ where: { name: { equals: cname, mode: 'insensitive' } } })
        }
        if (!cat) {
          cat = await prisma.category.create({ data: { name: cname, slug: cslug } })
        }
        updateCategoryId = cat.id
      } else {
        updateCategoryId = null as unknown as string
      }
    } else {
      updateCategoryId = null as unknown as string
    }
  }

  try {
    // build final update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data }
    if (patch.categoryName !== undefined) {
      // set explicit categoryId (could be string or null)
      updateData.categoryId = updateCategoryId ?? null
    }

    const updated = await prisma.product.update({
      where: { id: String(id) },
      data: updateData,
      select: productSelect,
    })
    res.json({
      ...updated,
      categoryName: updated.category?.name ?? null,
      tag: updated.tag === 'PROMOCAO' ? 'Promoção' : updated.tag === 'NOVO' ? 'Novo' : undefined,
    })
  } catch (e: unknown) {
    if (isPrismaKnownError(e) && e.code === 'P2002') {
      return res.status(409).json({ message: 'Conflito de dados (slug/nome duplicado)' })
    }
    throw e
  }
}

export async function deleteProduct(req: Request, res: Response) {
  const { id } = req.params

  const current = await prisma.product.findUnique({ where: { id: String(id) }, select: { id: true } })
  if (!current) return res.status(404).json({ message: 'Produto não encontrado' })

  await prisma.product.delete({ where: { id: String(id) } })
  res.status(204).send()
}

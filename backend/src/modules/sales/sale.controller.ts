import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'

const saleStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
const paymentMethodSchema = z.enum(['PIX', 'CARD', 'CASH', 'TRANSFER', 'OTHER'])

const createSaleSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  productName: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().int().positive().default(1),
  total: z.coerce.number().finite().positive(),
  paymentMethod: paymentMethodSchema,
  amountPaid: z.coerce.number().finite().nonnegative().default(0),
  sellerId: z.string().uuid().optional(),
  customerName: z.string().trim().max(120).optional().nullable(),
  customerContact: z.string().trim().max(120).optional().nullable(),
  status: saleStatusSchema.optional().default('PENDING'),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

const updateStatusSchema = z.object({ status: saleStatusSchema })

type AuthenticatedRequest = Request & { user: { id: string; role: 'USER' | 'ADMIN' } }

function requireUser(req: Request): asserts req is AuthenticatedRequest {
  if (!req.user) throw new Error('authMiddleware not applied: req.user is missing')
}

const saleInclude = {
  seller: { select: { id: true, name: true, email: true } },
  items: { include: { product: { select: { id: true, name: true, slug: true } } } },
} as const

export async function listSellers(_req: Request, res: Response) {
  const sellers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
  return res.json(sellers)
}

export async function createSale(req: Request, res: Response) {
  requireUser(req)
  const parsed = createSaleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Dados da venda inválidos.', errors: parsed.error.flatten() })

  const data = parsed.data
  const [product, seller] = await Promise.all([
    data.productId ? prisma.product.findUnique({ where: { id: data.productId }, select: { id: true, name: true } }) : Promise.resolve(null),
    prisma.user.findUnique({ where: { id: data.sellerId ?? req.user.id }, select: { id: true, role: true, isActive: true } }),
  ])
  if (!seller || seller.role !== 'ADMIN') return res.status(400).json({ message: 'Vendedor inválido.' })

  const sale = await prisma.sale.create({
    data: {
      sellerId: seller.id,
      customerName: data.customerName || null,
      customerContact: data.customerContact || null,
      paymentMethod: data.paymentMethod,
      status: data.status,
      total: data.total,
      amountPaid: Math.min(data.amountPaid, data.total),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      completedAt: data.status === 'COMPLETED' ? new Date() : null,
      notes: data.notes || null,
      items: { create: { productId: product?.id ?? null, productName: data.productName, quantity: data.quantity, unitPrice: data.total / data.quantity } },
    },
    include: saleInclude,
  })
  return res.status(201).json(sale)
}

export async function listSales(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1)
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage ?? 20) || 20))
  const status = typeof req.query.status === 'string' && req.query.status ? saleStatusSchema.safeParse(req.query.status) : null
  if (status && !status.success) return res.status(400).json({ message: 'Status inválido.' })

  const where = status?.success ? { status: status.data } : {}
  const [items, total] = await Promise.all([
    prisma.sale.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { createdAt: 'desc' }, include: saleInclude }),
    prisma.sale.count({ where }),
  ])
  return res.json({ items, page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) })
}

export async function salesSummary(req: Request, res: Response) {
  const year = Math.min(9999, Math.max(2000, Number(req.query.year ?? new Date().getFullYear()) || new Date().getFullYear()))
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: start, lt: end }, status: { not: 'CANCELLED' } }, select: { total: true, status: true, createdAt: true } })

  const byMonth = Array.from({ length: 12 }, (_, month) => ({ month: month + 1, total: 0, count: 0 }))
  for (const sale of sales) {
    const month = sale.createdAt.getUTCMonth()
    const entry = byMonth[month]
    if (entry) { entry.total += sale.total; entry.count += 1 }
  }
  return res.json({ year, total: sales.reduce((sum, sale) => sum + sale.total, 0), count: sales.length, pending: sales.filter((sale) => sale.status === 'PENDING' || sale.status === 'IN_PROGRESS').length, byMonth })
}

export async function updateSaleStatus(req: Request, res: Response) {
  const parsed = updateStatusSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Status inválido.' })
  const existing = await prisma.sale.findUnique({ where: { id: String(req.params.id) }, select: { id: true } })
  if (!existing) return res.status(404).json({ message: 'Venda não encontrada.' })
  const sale = await prisma.sale.update({ where: { id: existing.id }, data: { status: parsed.data.status, completedAt: parsed.data.status === 'COMPLETED' ? new Date() : null }, include: saleInclude })
  return res.json(sale)
}
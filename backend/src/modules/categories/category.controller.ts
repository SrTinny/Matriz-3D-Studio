import { Request, Response } from 'express'
import { prisma } from '../../config/prisma'

export async function listCategories(_req: Request, res: Response) {
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } })
  res.json(cats)
}

export async function getCategory(req: Request, res: Response) {
  const { id } = req.params
  const cat = await prisma.category.findUnique({ where: { id: String(id) }, select: { id: true, name: true, slug: true } })
  if (!cat) return res.status(404).json({ message: 'Categoria não encontrada' })
  res.json(cat)
}

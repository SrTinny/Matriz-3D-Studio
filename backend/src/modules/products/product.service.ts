import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ProductService {
  async findAll() {
    return prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

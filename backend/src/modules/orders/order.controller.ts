import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';

type RequestWithUser = Request & { user: { id: string; role: 'USER' | 'ADMIN' } };

function requireUser(req: Request): asserts req is RequestWithUser {
  if (!req.user) {
    throw new Error('authMiddleware not applied: req.user is missing');
  }
}

const createOrderSchema = z.object({
  paymentMethod: z.enum(['PIX', 'CARD']),
});

// POST /orders (Checkout)
export async function checkout(req: Request, res: Response) {
  requireUser(req);
  const userId = req.user.id;

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Método de pagamento inválido.', errors: parsed.error.flatten() });
  }
  const { paymentMethod } = parsed.data;

  // 1. Carregar carrinho com itens e dados do produto
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Seu carrinho está vazio.' });
  }

  // 2. Carregar usuário e seu endereço selecionado
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      selectedAddress: true,
    },
  });

  if (!user || !user.selectedAddress) {
    return res.status(400).json({ message: 'Por favor, selecione um endereço de entrega nas configurações de sua conta.' });
  }

  const shippingAddress = user.selectedAddress;

  // 3. Validar estoque dos produtos e calcular total
  let total = 0;
  
  for (const item of cart.items) {
    const product = item.product;
    // Se o produto possui estoque físico (stock > 0), precisamos validar se há o suficiente
    if (product.stock > 0 && product.stock < item.quantity) {
      return res.status(400).json({
        message: `Estoque insuficiente para o produto: ${product.name}. Disponível: ${product.stock}, solicitado: ${item.quantity}.`,
      });
    }
    total += product.price * item.quantity;
  }

  // 4. Executar transação de Checkout
  try {
    const order = await prisma.$transaction(async (tx) => {
      // a) Criar o pedido
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: shippingAddress.id,
          shippingLabel: shippingAddress.label,
          shippingZipCode: shippingAddress.zipCode,
          shippingState: shippingAddress.state,
          shippingCity: shippingAddress.city,
          shippingNeighborhood: shippingAddress.neighborhood,
          shippingStreet: shippingAddress.street,
          shippingNumber: shippingAddress.number,
          shippingComplement: shippingAddress.complement,
          status: 'PAID', // Pedido simulado como pago
          paymentMethod,
          total,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // b) Reduzir o estoque dos produtos que possuem estoque físico
      for (const item of cart.items) {
        if (item.product.stock > 0) {
          const newStock = Math.max(0, item.product.stock - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });
        }
      }

      // c) Limpar o carrinho
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return res.status(201).json({
      message: 'Pedido finalizado com sucesso!',
      order,
    });
  } catch (error: any) {
    console.error('Erro no checkout:', error);
    return res.status(500).json({ message: 'Erro interno ao processar o checkout.' });
  }
}

// GET /orders (Histórico de pedidos do usuário)
export async function listOrders(req: Request, res: Response) {
  requireUser(req);
  const userId = req.user.id;

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar pedidos.' });
  }
}

// GET /orders/:id (Detalhes de um pedido)
export async function getOrder(req: Request, res: Response) {
  requireUser(req);
  const userId = req.user.id;
  const id = String(req.params.id);

  try {
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId, // garante que o usuário só acesse seus próprios pedidos
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar detalhes do pedido.' });
  }
}

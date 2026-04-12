import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { addItemSchema, updateItemQtySchema } from './cart.schemas';
import type { JwtUser } from '../../middlewares/auth';

/** Asserta que o middleware de auth rodou e tipa req.user */
function requireUser(req: Request): asserts req is Request & { user: JwtUser } {
  if (!req.user) {
    // Se cair aqui, é porque a rota não está com authMiddleware
    throw new Error('authMiddleware not applied: req.user is missing');
  }
}

/** Pega o carrinho do usuário; se não existir, cria */
async function getOrCreateCartByUserId(userId: string) {
  // Evita depender de chave única em userId
  let cart = await prisma.cart.findFirst({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

/** GET /cart -> retorna o carrinho com itens + info básica do produto */
export async function getCart(req: Request, res: Response) {
  requireUser(req);

  const base = await getOrCreateCartByUserId(req.user.id);
  const full = await prisma.cart.findUnique({
    where: { id: base.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, price: true } },
        },
      },
    },
  });

  res.json(full);
}

/** POST /cart/items -> { productId, quantity }  (adiciona/incrementa item) */
export async function addItem(req: Request, res: Response) {
  requireUser(req);

  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }

  const { productId, quantity } = parsed.data;

  // valida produto existir
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

  const cart = await getOrCreateCartByUserId(req.user.id);

  // se já existe o item desse produto, incrementa
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: true },
      })
    : await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
        include: { product: true },
      });

  res.status(existing ? 200 : 201).json(item);
}

/** PATCH /cart/items/:itemId -> { quantity } (0 = remove) */
export async function updateItemQuantity(
  req: Request<{ itemId: string }>,
  res: Response
) {
  requireUser(req);
  const { itemId } = req.params;

  const parsed = updateItemQtySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }
  const { quantity } = parsed.data;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== req.user.id) {
    return res.status(404).json({ message: 'Item não encontrado no seu carrinho' });
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return res.status(204).send();
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { product: true },
  });

  res.json(updated);
}

/** DELETE /cart/items/:itemId -> remove item do carrinho */
export async function removeItem(req: Request<{ itemId: string }>, res: Response) {
  requireUser(req);
  const { itemId } = req.params;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== req.user.id) {
    return res.status(404).json({ message: 'Item não encontrado no seu carrinho' });
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  res.status(204).send();
}

/** Limpa todo o carrinho do usuário logado */
export async function clearCart(req: Request, res: Response) {
  try {
    // Aqui pegamos o userId que você injeta no middleware de auth
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Apaga todos os itens cujo carrinho pertence ao usuário
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: userId,
        },
      },
    });

    res.status(204).send(); // Sucesso, sem conteúdo
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao limpar o carrinho' });
  }
}

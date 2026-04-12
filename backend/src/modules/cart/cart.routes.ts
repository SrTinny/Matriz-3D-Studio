import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { csrfProtection } from '../../middlewares/csrf';
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} from './cart.controller';

const router = Router();

// todas as rotas do carrinho exigem usuário logado
router.use(authMiddleware);
router.use(csrfProtection);

// GET /cart
router.get('/', getCart);

// POST /cart/items  { productId, quantity }
router.post('/items', addItem);

// PATCH /cart/items/:itemId  { quantity }  (se 0, remove)
router.patch('/items/:itemId', updateItemQuantity);

// DELETE /cart/items/:itemId  (remove item específico)
router.delete('/items/:itemId', removeItem);

// DELETE /cart  (limpa tudo)
router.delete('/', clearCart);

export default router;

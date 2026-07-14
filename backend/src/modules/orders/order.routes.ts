import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { csrfProtection } from '../../middlewares/csrf';
import {
  checkout,
  listOrders,
  getOrder,
} from './order.controller';

const router = Router();

// Todas as rotas de pedidos exigem autenticação e proteção CSRF
router.use(authMiddleware);
router.use(csrfProtection);

// POST /orders (Checkout)
router.post('/', checkout);

// GET /orders (Histórico de pedidos)
router.get('/', listOrders);

// GET /orders/:id (Detalhes de um pedido)
router.get('/:id', getOrder);

export default router;

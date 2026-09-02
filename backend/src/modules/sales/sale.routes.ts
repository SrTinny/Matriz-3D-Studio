import { Router } from 'express'
import { authMiddleware, adminGuard } from '../../middlewares/auth'
import { csrfProtection } from '../../middlewares/csrf'
import { createSale, listSales, listSellers, salesSummary, updateSaleStatus } from './sale.controller'

const router = Router()
router.use(authMiddleware, adminGuard)
router.get('/sellers', listSellers)
router.get('/summary', salesSummary)
router.get('/', listSales)
router.post('/', csrfProtection, createSale)
router.patch('/:id/status', csrfProtection, updateSaleStatus)

export default router
import { Router } from 'express'
import * as c from './category.controller'

const router = Router()

router.get('/', c.listCategories)
router.get('/:id', c.getCategory)

export default router

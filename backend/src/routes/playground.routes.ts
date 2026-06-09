import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { executeCode } from '../controllers/playground.controller'

const router = Router()

router.post('/execute', authenticate, executeCode)

export default router

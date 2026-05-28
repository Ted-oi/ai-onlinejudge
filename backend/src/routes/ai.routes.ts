import { Router } from 'express'
import * as aiController from '../controllers/ai.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/chat', authenticate, aiController.chat)
router.post('/analyze', authenticate, aiController.analyzeCode)
router.get('/conversations/:userId', authenticate, aiController.getConversations)

export default router
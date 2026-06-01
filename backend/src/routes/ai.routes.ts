import { Router } from 'express'
import * as aiController from '../controllers/ai.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/chat', authenticate, aiController.chat)
router.post('/analyze', authenticate, aiController.analyzeCode)
router.post('/hint', authenticate, aiController.getHint)
router.post('/explain-error', authenticate, aiController.explainError)
router.get('/recommendations', authenticate, aiController.getRecommendations)
router.get('/conversations/:userId', authenticate, aiController.getConversations)

export default router
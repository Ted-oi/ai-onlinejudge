import { Router } from 'express'
import * as aiController from '../controllers/ai.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/chat', authenticate, aiController.chat)
router.post('/analyze', authenticate, aiController.analyzeCode)
router.post('/hint', authenticate, aiController.getHint)
router.post('/explain-error', authenticate, aiController.explainError)
router.get('/recommendations', authenticate, aiController.getRecommendations)
router.get('/conversations/:userId', authenticate, (req, res, next) => {
  if (req.userId !== parseInt(req.params.userId) && req.userRole !== 'admin') {
    return res.status(403).json({ success: false, error: { message: '无权访问他人的对话' } })
  }
  next()
}, aiController.getConversations)

export default router
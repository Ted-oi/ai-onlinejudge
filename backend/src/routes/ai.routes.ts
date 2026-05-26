import { Router } from 'express'
import * as aiController from '../controllers/ai.controller'

const router = Router()

router.post('/chat', aiController.chat)
router.post('/analyze', aiController.analyzeCode)
router.get('/conversations/:userId', aiController.getConversations)

export default router
import { Router } from 'express'
import * as codeShareController from '../controllers/codeShare.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/my', authenticate, codeShareController.getMySharedCodes)
router.get('/', authenticate, codeShareController.getSharedCodes)
router.get('/:id', authenticate, codeShareController.getSharedCodeById)
router.post('/', authenticate, codeShareController.createSharedCode)
router.put('/:id', authenticate, codeShareController.updateSharedCode)
router.delete('/:id', authenticate, codeShareController.deleteSharedCode)
router.post('/:id/like', authenticate, codeShareController.toggleLike)
router.post('/:id/pin', authenticate, codeShareController.togglePin)
router.get('/:id/comments', authenticate, codeShareController.getComments)
router.post('/:id/comments', authenticate, codeShareController.createComment)
router.delete('/:id/comments/:commentId', authenticate, codeShareController.deleteComment)

export default router

import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import * as discussionController from '../controllers/discussion.controller'

const router = Router()

router.use(authenticate)

router.get('/problems/:problemId', discussionController.getDiscussions)
router.post('/problems/:problemId', discussionController.createDiscussion)
router.get('/:id', discussionController.getDiscussion)
router.put('/:id', discussionController.updateDiscussion)
router.delete('/:id', discussionController.deleteDiscussion)
router.post('/:id/replies', discussionController.createReply)

export default router

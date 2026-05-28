import { Router } from 'express'
import * as contestController from '../controllers/contest.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, contestController.getContests)
router.get('/:id', authenticate, contestController.getContestById)
router.post('/', authenticate, authorize('admin', 'teacher'), contestController.createContest)
router.put('/:id', authenticate, authorize('admin', 'teacher'), contestController.updateContest)
router.delete('/:id', authenticate, authorize('admin', 'teacher'), contestController.deleteContest)
router.post('/:id/register', authenticate, contestController.registerForContest)
router.get('/:id/standings', authenticate, contestController.getContestStandings)

export default router
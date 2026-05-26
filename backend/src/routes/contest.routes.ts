import { Router } from 'express'
import * as contestController from '../controllers/contest.controller'

const router = Router()

router.get('/', contestController.getContests)
router.get('/:id', contestController.getContestById)
router.post('/', contestController.createContest)
router.put('/:id', contestController.updateContest)
router.delete('/:id', contestController.deleteContest)
router.post('/:id/register', contestController.registerForContest)

export default router
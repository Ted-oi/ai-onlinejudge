import { Router } from 'express'
import * as submissionController from '../controllers/submission.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/', authenticate, submissionController.createSubmission)
router.get('/:id', authenticate, submissionController.getSubmissionById)
router.get('/', authenticate, submissionController.getSubmissions)
router.get('/user/:userId', authenticate, submissionController.getUserSubmissions)

export default router
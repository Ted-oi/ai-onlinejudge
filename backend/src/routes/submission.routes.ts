import { Router } from 'express'
import * as submissionController from '../controllers/submission.controller'

const router = Router()

router.post('/', submissionController.createSubmission)
router.get('/:id', submissionController.getSubmissionById)
router.get('/', submissionController.getSubmissions)
router.get('/user/:userId', submissionController.getUserSubmissions)

export default router
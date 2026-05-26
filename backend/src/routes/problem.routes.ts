import { Router } from 'express'
import * as problemController from '../controllers/problem.controller'

const router = Router()

router.get('/', problemController.getProblems)
router.get('/:id', problemController.getProblemById)
router.post('/', problemController.createProblem)
router.put('/:id', problemController.updateProblem)
router.delete('/:id', problemController.deleteProblem)

export default router
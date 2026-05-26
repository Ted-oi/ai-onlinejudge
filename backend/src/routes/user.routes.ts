import { Router } from 'express'
import * as userController from '../controllers/user.controller'

const router = Router()

router.get('/', userController.getUsers)
router.get('/:id', userController.getUserById)
router.put('/:id', userController.updateUser)
router.get('/:id/stats', userController.getUserStats)

export default router
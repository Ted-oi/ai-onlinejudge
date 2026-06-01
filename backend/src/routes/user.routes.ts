import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, userController.getUsers)
router.get('/:id', authenticate, userController.getUserById)
router.put('/:id', authenticate, userController.updateUser)
router.get('/:id/stats', authenticate, userController.getUserStats)
router.get('/:id/favorites', authenticate, userController.getUserFavorites)
router.get('/:id/skill-radar', authenticate, userController.getUserSkillRadar)
router.get('/:id/activity-heatmap', authenticate, userController.getUserActivityHeatmap)

export default router
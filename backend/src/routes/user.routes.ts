import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, userController.getUsers)
router.get('/:id', authenticate, userController.getUserById)
router.put('/:id', authenticate, (req, res, next) => {
  if ((req as any).userId !== parseInt(req.params.id) && (req as any).userRole !== 'admin') {
    return res.status(403).json({ success: false, error: { message: '无权修改他人的资料' } })
  }
  next()
}, userController.updateUser)
router.get('/:id/stats', authenticate, userController.getUserStats)
router.get('/:id/favorites', authenticate, userController.getUserFavorites)
router.get('/:id/skill-radar', authenticate, userController.getUserSkillRadar)
router.get('/:id/activity-heatmap', authenticate, userController.getUserActivityHeatmap)

export default router
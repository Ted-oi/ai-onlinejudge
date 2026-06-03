import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, userController.getUsers)
router.get('/profile/:id', authenticate, userController.getPublicProfile)
router.get('/:id', authenticate, userController.getUserById)
router.get('/:id/achievements', authenticate, userController.getUserAchievements)
router.get('/:id/rating-history', authenticate, userController.getRatingHistory)
router.get('/:id/solved-problems', authenticate, userController.getSolvedProblems)
router.get('/:id/stats', authenticate, userController.getUserStats)
router.get('/:id/favorites', authenticate, userController.getUserFavorites)
router.get('/:id/skill-radar', authenticate, userController.getUserSkillRadar)
router.get('/:id/activity-heatmap', authenticate, userController.getUserActivityHeatmap)
router.post('/:id/check-badges', authenticate, userController.checkBadges)
router.put('/:id', authenticate, (req, res, next) => {
  if (req.userId !== parseInt(req.params.id) && req.userRole !== 'admin') {
    return res.status(403).json({ success: false, error: { message: '无权修改他人的资料' } })
  }
  next()
}, userController.updateUser)

export default router

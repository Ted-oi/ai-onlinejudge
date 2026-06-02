import { Router } from 'express'
import * as teamController from '../controllers/team.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.get('/my', authenticate, teamController.getMyTeams)
router.get('/leaderboard', authenticate, teamController.getGlobalTeamLeaderboard)
router.post('/join-by-code', authenticate, teamController.joinByCode)
router.get('/', authenticate, teamController.getTeams)
router.get('/:id', authenticate, teamController.getTeamById)
router.get('/:id/members', authenticate, teamController.getTeamMembers)
router.get('/:id/stats', authenticate, teamController.getTeamStats)
router.get('/:id/leaderboard', authenticate, teamController.getTeamLeaderboard)
router.post('/', authenticate, teamController.createTeam)
router.put('/:id', authenticate, teamController.updateTeam)
router.delete('/:id', authenticate, teamController.deleteTeam)
router.post('/:id/join', authenticate, teamController.joinTeam)
router.post('/:id/leave', authenticate, teamController.leaveTeam)
router.delete('/:id/members/:userId', authenticate, teamController.removeMember)
router.put('/:id/transfer', authenticate, teamController.transferLeadership)
router.post('/:id/invite-code', authenticate, teamController.generateInvite)

export default router

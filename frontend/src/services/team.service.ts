import api from './api'

const teamService = {
  getTeams: (params?: { team_type?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/teams', { params }).then(res => res.data.data),

  getMyTeams: () =>
    api.get('/teams/my').then(res => res.data.data),

  getTeamById: (id: number) =>
    api.get(`/teams/${id}`).then(res => res.data.data),

  getTeamMembers: (id: number) =>
    api.get(`/teams/${id}/members`).then(res => res.data.data),

  getTeamStats: (id: number) =>
    api.get(`/teams/${id}/stats`).then(res => res.data.data),

  getTeamLeaderboard: (id: number) =>
    api.get(`/teams/${id}/leaderboard`).then(res => res.data.data),

  getGlobalLeaderboard: (params?: { team_type?: string; page?: number; limit?: number }) =>
    api.get('/teams/leaderboard', { params }).then(res => res.data.data),

  createTeam: (data: { name: string; description?: string; team_type?: string; max_members?: number; is_public?: boolean }) =>
    api.post('/teams', data).then(res => res.data.data),

  updateTeam: (id: number, data: any) =>
    api.put(`/teams/${id}`, data).then(res => res.data.data),

  deleteTeam: (id: number) =>
    api.delete(`/teams/${id}`).then(res => res.data),

  joinTeam: (id: number, invite_code?: string) =>
    api.post(`/teams/${id}/join`, { invite_code }).then(res => res.data),

  leaveTeam: (id: number) =>
    api.post(`/teams/${id}/leave`).then(res => res.data),

  removeMember: (teamId: number, userId: number) =>
    api.delete(`/teams/${teamId}/members/${userId}`).then(res => res.data),

  transferLeadership: (teamId: number, newLeaderId: number) =>
    api.put(`/teams/${teamId}/transfer`, { new_leader_id: newLeaderId }).then(res => res.data),

  generateInviteCode: (id: number) =>
    api.post(`/teams/${id}/invite-code`).then(res => res.data.data),

  joinByCode: (invite_code: string) =>
    api.post('/teams/join-by-code', { invite_code }).then(res => res.data.data),
}

export default teamService

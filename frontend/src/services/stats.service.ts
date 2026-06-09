import api from './api'

const statsService = {
  getSubmissionTrend: async () => {
    const res = await api.get('/stats/submission-trend')
    return res.data.data
  },
  getDifficultyDistribution: async () => {
    const res = await api.get('/stats/difficulty-distribution')
    return res.data.data
  },
  getAdminTrend: async () => {
    const res = await api.get('/stats/admin-trend')
    return res.data.data
  },
}

export default statsService

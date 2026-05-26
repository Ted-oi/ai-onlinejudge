import api from './api'
import type { Contest, ContestDetail, ContestQuery, CreateContestDTO } from '../types/contest'

const contestService = {
  getContests: async (query?: ContestQuery): Promise<Contest[]> => {
    const response = await api.get('/contests', { params: query })
    return response.data.data.contests
  },

  getContestById: async (id: number): Promise<ContestDetail> => {
    const response = await api.get(`/contests/${id}`)
    const { contest, problem_ids } = response.data.data
    return { ...contest, problem_ids }
  },

  createContest: async (data: CreateContestDTO): Promise<Contest> => {
    const response = await api.post('/contests', data)
    return response.data.data.contest
  },

  updateContest: async (id: number, data: Partial<Contest>): Promise<Contest> => {
    const response = await api.put(`/contests/${id}`, data)
    return response.data.data.contest
  },

  deleteContest: async (id: number): Promise<void> => {
    await api.delete(`/contests/${id}`)
  },

  registerForContest: async (contestId: number, userId: number): Promise<void> => {
    await api.post(`/contests/${contestId}/register`, { user_id: userId })
  },
}

export default contestService

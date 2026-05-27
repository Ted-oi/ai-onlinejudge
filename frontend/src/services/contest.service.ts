import api from './api'
import type { Contest, ContestDetail, ContestQuery, CreateContestDTO } from '../types/contest'

export interface StandingEntry {
  user_id: number
  username: string
  avatar: string | null
  solved: number
  time: number
  problems: Record<number, { solved: boolean; attempts: number; time: number | null }>
}

export interface StandingsData {
  standings: StandingEntry[]
  problems: number[]
}

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

  getStandings: async (contestId: number): Promise<StandingsData> => {
    const response = await api.get(`/contests/${contestId}/standings`)
    return response.data.data
  },
}

export default contestService

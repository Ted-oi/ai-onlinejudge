import api from './api'
import { Problem } from '../types'

export interface ProblemQuery {
  difficulty?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}

export const problemService = {
  getProblems: async (query?: ProblemQuery): Promise<{ problems: Problem[]; total: number }> => {
    const response = await api.get('/problems', { params: query })
    return { problems: response.data.data.problems, total: response.data.data.total }
  },

  getProblemById: async (id: number): Promise<Problem> => {
    const response = await api.get(`/problems/${id}`)
    return response.data.data.problem
  },

  createProblem: async (data: Partial<Problem>): Promise<Problem> => {
    const response = await api.post('/problems', data)
    return response.data.data.problem
  },

  updateProblem: async (id: number, data: Partial<Problem>): Promise<Problem> => {
    const response = await api.put(`/problems/${id}`, data)
    return response.data.data.problem
  },

  deleteProblem: async (id: number): Promise<void> => {
    await api.delete(`/problems/${id}`)
  },

  toggleFavorite: async (id: number): Promise<{ favorited: boolean }> => {
    const response = await api.post(`/problems/${id}/favorite`)
    return response.data.data
  },

  checkFavorite: async (id: number): Promise<{ favorited: boolean }> => {
    const response = await api.get(`/problems/${id}/favorite`)
    return response.data.data
  },
}
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
  getProblems: async (query?: ProblemQuery): Promise<Problem[]> => {
    const response = await api.get('/problems', { params: query })
    return response.data.data.problems
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
}
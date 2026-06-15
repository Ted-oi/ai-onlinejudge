import api from './api'
import { Problem } from '../types'

export interface ProblemQuery {
  difficulty?: string
  category?: string
  tags?: string
  search?: string
  page?: number
  limit?: number
  problem_type?: 'coding' | 'objective'
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

  getTags: async (): Promise<{ tag: string; count: number }[]> => {
    const response = await api.get('/problems/meta/tags')
    return response.data.data.tags
  },

  exportProblems: async (params?: { ids?: string; difficulty?: string; category?: string }): Promise<Blob> => {
    const response = await api.get('/problems-export', { params, responseType: 'blob' })
    return response.data
  },

  importProblems: async (problems: any[]): Promise<any> => {
    const response = await api.post('/problems-import', { problems })
    return response.data.data
  },

  checkPlagiarism: async (problemId: number, minSimilarity?: number): Promise<any> => {
    const response = await api.post(`/plagiarism/${problemId}`, null, {
      params: { min_similarity: minSimilarity || 0.5 }
    })
    return response.data.data
  },

  downloadObjectiveTemplate: async (): Promise<Blob> => {
    const response = await api.get('/objective-template', { responseType: 'blob' })
    return response.data
  },

  importObjectiveExcel: async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/objective-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },
}
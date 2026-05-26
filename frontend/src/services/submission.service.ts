import api from './api'
import type { Submission } from '../types'

export interface CreateSubmissionData {
  problem_id: number
  user_id: number
  language: string
  code: string
}

export const submissionService = {
  createSubmission: async (data: CreateSubmissionData): Promise<Submission> => {
    const response = await api.post('/submissions', data)
    return response.data.data.submission
  },

  getSubmissionById: async (id: number): Promise<Submission> => {
    const response = await api.get(`/submissions/${id}`)
    return response.data.data.submission
  },

  getSubmissions: async (filters?: {
    problem_id?: number
    user_id?: number
    status?: string
    page?: number
    limit?: number
  }): Promise<Submission[]> => {
    const response = await api.get('/submissions', { params: filters })
    return response.data.data.submissions
  },

  getUserSubmissions: async (userId: number, filters?: any): Promise<Submission[]> => {
    const response = await api.get(`/submissions/user/${userId}`, { params: filters })
    return response.data.data.submissions
  },
}
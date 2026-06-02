import api from './api'

const problemSetService = {
  getProblemSets: async (params?: { category?: string; difficulty?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/problem-sets', { params }).then(res => res.data.data),

  getProblemSetById: async (id: number) =>
    api.get(`/problem-sets/${id}`).then(res => res.data.data),

  createProblemSet: async (data: any) =>
    api.post('/problem-sets', data).then(res => res.data.data),

  updateProblemSet: async (id: number, data: any) =>
    api.put(`/problem-sets/${id}`, data).then(res => res.data.data),

  deleteProblemSet: async (id: number) =>
    api.delete(`/problem-sets/${id}`).then(res => res.data),

  publishProblemSet: async (id: number) =>
    api.post(`/problem-sets/${id}/publish`).then(res => res.data.data),
}

export default problemSetService

import api from './api'

const codeShareService = {
  getSharedCodes: (params?: { problem_id?: number; language?: string; user_id?: number; search?: string; sort?: string; page?: number; limit?: number }) =>
    api.get('/code-shares', { params }).then(res => res.data.data),

  getMySharedCodes: (params?: { page?: number; limit?: number }) =>
    api.get('/code-shares/my', { params }).then(res => res.data.data),

  getSharedCodeById: (id: number) =>
    api.get(`/code-shares/${id}`).then(res => res.data.data),

  createSharedCode: (data: { title: string; code: string; language: string; problem_id?: number; submission_id?: number; description?: string; tags?: string[]; is_public?: boolean }) =>
    api.post('/code-shares', data).then(res => res.data.data),

  updateSharedCode: (id: number, data: { title?: string; code?: string; description?: string; tags?: string[]; is_public?: boolean }) =>
    api.put(`/code-shares/${id}`, data).then(res => res.data.data),

  deleteSharedCode: (id: number) =>
    api.delete(`/code-shares/${id}`).then(res => res.data),

  toggleLike: (id: number) =>
    api.post(`/code-shares/${id}/like`).then(res => res.data.data),

  togglePin: (id: number) =>
    api.post(`/code-shares/${id}/pin`).then(res => res.data.data),

  getComments: (id: number) =>
    api.get(`/code-shares/${id}/comments`).then(res => res.data.data),

  createComment: (id: number, data: { content: string; parent_id?: number }) =>
    api.post(`/code-shares/${id}/comments`, data).then(res => res.data.data),

  deleteComment: (id: number, commentId: number) =>
    api.delete(`/code-shares/${id}/comments/${commentId}`).then(res => res.data),
}

export default codeShareService

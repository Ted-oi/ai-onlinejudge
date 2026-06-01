import api from './api'

const discussionService = {
  getDiscussions: (problemId: number, params?: { page?: number; limit?: number }) =>
    api.get(`/discussions/problems/${problemId}`, { params }).then(res => res.data.data),

  createDiscussion: (problemId: number, data: { title: string; content: string }) =>
    api.post(`/discussions/problems/${problemId}`, data).then(res => res.data.data),

  getDiscussion: (id: number) =>
    api.get(`/discussions/${id}`).then(res => res.data.data),

  updateDiscussion: (id: number, data: { title?: string; content?: string; is_pinned?: boolean }) =>
    api.put(`/discussions/${id}`, data).then(res => res.data.data),

  deleteDiscussion: (id: number) =>
    api.delete(`/discussions/${id}`).then(res => res.data),

  createReply: (discussionId: number, data: { content: string; parent_reply_id?: number }) =>
    api.post(`/discussions/${discussionId}/replies`, data).then(res => res.data.data),
}

export default discussionService

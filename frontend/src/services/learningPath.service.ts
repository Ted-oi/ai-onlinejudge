import api from './api'

const learningPathService = {
  getLearningPaths: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/learning-paths', { params }).then(res => res.data.data),

  getLearningPathById: (id: number) =>
    api.get(`/learning-paths/${id}`).then(res => res.data.data),

  getMyEnrolledPaths: () =>
    api.get('/learning-paths/my').then(res => res.data.data),

  getNextProblem: () =>
    api.get('/learning-paths/next-problem').then(res => res.data.data),

  getRecommendedPath: () =>
    api.get('/learning-paths/recommended').then(res => res.data.data),

  createLearningPath: (data: any) =>
    api.post('/learning-paths', data).then(res => res.data.data),

  updateLearningPath: (id: number, data: any) =>
    api.put(`/learning-paths/${id}`, data).then(res => res.data.data),

  deleteLearningPath: (id: number) =>
    api.delete(`/learning-paths/${id}`).then(res => res.data),

  enrollInPath: (id: number) =>
    api.post(`/learning-paths/${id}/enroll`).then(res => res.data),

  unenrollFromPath: (id: number) =>
    api.delete(`/learning-paths/${id}/enroll`).then(res => res.data),
}

export default learningPathService

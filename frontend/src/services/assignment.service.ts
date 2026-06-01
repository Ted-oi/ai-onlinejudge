import api from './api'

const assignmentService = {
  getAssignments: (courseId: number) =>
    api.get(`/assignments/courses/${courseId}`).then(res => res.data.data),

  createAssignment: (courseId: number, data: any) =>
    api.post(`/assignments/courses/${courseId}`, data).then(res => res.data.data),

  getAssignment: (id: number) =>
    api.get(`/assignments/${id}`).then(res => res.data.data),

  updateAssignment: (id: number, data: any) =>
    api.put(`/assignments/${id}`, data).then(res => res.data.data),

  deleteAssignment: (id: number) =>
    api.delete(`/assignments/${id}`).then(res => res.data),

  getAssignmentProgress: (id: number) =>
    api.get(`/assignments/${id}/progress`).then(res => res.data.data),
}

export default assignmentService

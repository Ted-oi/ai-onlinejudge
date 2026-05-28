import api from './api'

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/stats')
    return res.data.data
  },

  getPublicStats: async () => {
    const res = await api.get('/stats')
    return res.data.data
  },

  updateUserRole: async (id: number, role: string) => {
    const res = await api.put(`/admin/users/${id}/role`, { role })
    return res.data.data
  },
}

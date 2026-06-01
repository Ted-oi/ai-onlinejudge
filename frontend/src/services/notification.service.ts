import api from './api'

const notificationService = {
  getNotifications: (params?: { unread?: boolean; page?: number; limit?: number }) =>
    api.get('/notifications', { params }).then(res => res.data.data),

  getUnreadCount: () =>
    api.get('/notifications/unread-count').then(res => res.data.data),

  markAsRead: (id: number) =>
    api.put(`/notifications/${id}/read`).then(res => res.data),

  markAllAsRead: () =>
    api.put('/notifications/read-all').then(res => res.data),
}

export default notificationService

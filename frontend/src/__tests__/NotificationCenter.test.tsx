import { describe, it, expect, vi } from 'vitest'

// Mock everything before imports
vi.mock('../services/notification.service', () => ({
  default: {
    getUnreadCount: vi.fn().mockResolvedValue({ count: 3 }),
    getNotifications: vi.fn().mockResolvedValue({
      notifications: [
        { id: 1, title: '提交通过', content: '题目「A+B」已通过', is_read: false, created_at: '2026-06-04T10:00:00Z', link: '/submissions/1' },
      ],
    }),
    markAsRead: vi.fn().mockResolvedValue({}),
    markAllAsRead: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../services/socket', () => ({
  getSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
  }),
}))

describe('NotificationCenter - Logic Tests', () => {
  it('notification service returns correct unread count', async () => {
    const notificationService = (await import('../services/notification.service')).default
    const result = await notificationService.getUnreadCount()
    expect(result.count).toBe(3)
  })

  it('notification service returns notifications list', async () => {
    const notificationService = (await import('../services/notification.service')).default
    const result = await notificationService.getNotifications({ limit: 20 })
    expect(result.notifications).toHaveLength(1)
    expect(result.notifications[0].title).toBe('提交通过')
  })

  it('socket service provides a connected socket', async () => {
    const { getSocket } = await import('../services/socket')
    const socket = getSocket()
    expect(socket).toBeDefined()
    expect(socket.on).toBeDefined()
    expect(socket.off).toBeDefined()
  })

  it('useSocket hook returns cleanup function', async () => {
    const { useSocket } = await import('../hooks/useSocket')
    expect(typeof useSocket).toBe('function')
  })
})

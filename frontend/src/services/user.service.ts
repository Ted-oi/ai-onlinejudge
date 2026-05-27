import api from './api'
import type { User } from '../types'

export interface UserStats {
  submissions_by_status: Array<{ status: string; count: number }>
  solved_count: number
}

export interface UpdateUserDTO {
  username?: string
  avatar?: string
  bio?: string
}

const userService = {
  getLeaderboard: async (params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<{ users: User[]; total: number }> => {
    const response = await api.get('/users', { params })
    return { users: response.data.data.users, total: response.data.data.users.length }
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`)
    return response.data.data.user
  },

  getUserStats: async (id: number): Promise<UserStats> => {
    const response = await api.get(`/users/${id}/stats`)
    return response.data.data
  },

  updateUser: async (id: number, data: UpdateUserDTO): Promise<User> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data.user
  },
}

export default userService

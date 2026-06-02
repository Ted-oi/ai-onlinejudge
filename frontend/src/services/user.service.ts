import api from './api'
import type { User, UserAchievement, RatingHistoryEntry, SolvedProblem } from '../types'

export interface UserStats {
  submissions_by_status: Array<{ status: string; count: number }>
  solved_count: number
}

export interface UpdateUserDTO {
  username?: string
  avatar?: string
  bio?: string
  school?: string
  organization?: string
  github_url?: string
}

export interface PublicProfile {
  user: User
  stats: Array<{ status: string; count: number }>
  achievements: UserAchievement[]
  categories: Array<{ category: string; solved_count: number }>
}

const userService = {
  getLeaderboard: async (params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<{ users: User[]; total: number }> => {
    const response = await api.get('/users', { params })
    return { users: response.data.data.users, total: response.data.data.total ?? response.data.data.users.length }
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`)
    return response.data.data.user
  },

  getPublicProfile: async (id: number): Promise<PublicProfile> => {
    const response = await api.get(`/users/profile/${id}`)
    return response.data.data
  },

  getUserStats: async (id: number): Promise<UserStats> => {
    const response = await api.get(`/users/${id}/stats`)
    return response.data.data
  },

  updateUser: async (id: number, data: UpdateUserDTO): Promise<User> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data.user
  },

  uploadAvatar: async (id: number, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data.avatar
  },

  getFavorites: async (id: number) => {
    const response = await api.get(`/users/${id}/favorites`)
    return response.data.data.favorites
  },

  getSkillRadar: async (id: number) => {
    const response = await api.get(`/users/${id}/skill-radar`)
    return response.data.data.skills
  },

  getActivityHeatmap: async (id: number) => {
    const response = await api.get(`/users/${id}/activity-heatmap`)
    return response.data.data.activities
  },

  getAchievements: async (id: number): Promise<UserAchievement[]> => {
    const response = await api.get(`/users/${id}/achievements`)
    return response.data.data.achievements
  },

  getRatingHistory: async (id: number): Promise<RatingHistoryEntry[]> => {
    const response = await api.get(`/users/${id}/rating-history`)
    return response.data.data.history
  },

  getSolvedProblems: async (id: number, params?: { page?: number; limit?: number; difficulty?: string; category?: string }): Promise<{ problems: SolvedProblem[]; total: number }> => {
    const response = await api.get(`/users/${id}/solved-problems`, { params })
    return response.data.data
  },

  checkBadges: async (id: number): Promise<string[]> => {
    const response = await api.post(`/users/${id}/check-badges`)
    return response.data.data.new_badges
  },
}

export default userService

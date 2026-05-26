import api from './api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const aiService = {
  chat: async (data: {
    user_id: number
    problem_id?: number
    message: string
    conversation_id?: number
  }) => {
    const response = await api.post('/ai/chat', data)
    return response.data.data
  },

  analyzeCode: async (data: {
    code: string
    language: string
    problem_description: string
  }) => {
    const response = await api.post('/ai/analyze', data)
    return response.data.data.analysis
  },

  getConversations: async (userId: number) => {
    const response = await api.get(`/ai/conversations/${userId}`)
    return response.data.data.conversations
  },
}
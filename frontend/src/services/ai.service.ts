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

  getHint: async (data: { problem_id: number; level: number }) => {
    const response = await api.post('/ai/hint', data)
    return response.data.data
  },

  explainError: async (submissionId: number) => {
    const response = await api.post('/ai/explain-error', { submission_id: submissionId })
    return response.data.data
  },

  getRecommendations: async () => {
    const response = await api.get('/ai/recommendations')
    return response.data.data
  },

  getConversations: async (userId: number) => {
    const response = await api.get(`/ai/conversations/${userId}`)
    return response.data.data.conversations
  },
}

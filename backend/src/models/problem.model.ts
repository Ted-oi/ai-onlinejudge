export interface Problem {
  id: number
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  categories?: string[]  // 支持多个分类
  time_limit: number
  memory_limit: number
  examples: any[]
  created_at: Date
  updated_at: Date
}

export interface CreateProblemDTO {
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  categories?: string[]
  time_limit: number
  memory_limit: number
  examples: any[]
}

export interface UpdateProblemDTO {
  title?: string
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  categories?: string[]
  time_limit?: number
  memory_limit?: number
  examples?: any[]
}
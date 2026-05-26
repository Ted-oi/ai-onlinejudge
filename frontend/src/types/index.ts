export interface User {
  id: number
  username: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  avatar?: string
  bio?: string
  rating: number
  solved_count: number
  submit_count: number
  created_at: string
  updated_at: string
}

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
  created_at: string
  updated_at: string
}

export interface Submission {
  id: number
  problem_id: number
  user_id: number
  language: string
  code: string
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error'
  runtime?: number
  memory?: number
  created_at: string
}

export interface Course {
  id: number
  title: string
  description: string
  category: string
  instructor_id: number
  created_at: string
  updated_at: string
}

export { type Contest, type ContestDetail, type ContestQuery } from './contest'
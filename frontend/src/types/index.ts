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
  school?: string
  organization?: string
  github_url?: string
  created_at: string
  updated_at: string
}

export interface UserAchievement {
  id: number
  badge_type: string
  badge_name: string
  description: string
  icon: string
  earned_at: string
}

export interface RatingHistoryEntry {
  rating: number
  reason: string
  contest_id?: number
  created_at: string
}

export interface SolvedProblem {
  problem_id: number
  title: string
  difficulty: string
  category: string
  solved_at: string
}

export interface ObjectiveData {
  type: 'choice' | 'judge'
  options?: string[]
  answer?: number | boolean
}

export interface Problem {
  id: number
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  categories?: string[]
  time_limit: number
  memory_limit: number
  examples: any[]
  problem_type?: 'coding' | 'objective'
  objective_data?: ObjectiveData | null
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
export { type ProblemSet, type ProblemSetDetail, type ProblemSetProblem } from './problemSet'
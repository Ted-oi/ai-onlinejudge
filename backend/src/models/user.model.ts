export interface User {
  id: number
  username: string
  email: string
  password: string
  role: 'student' | 'teacher' | 'admin'
  avatar?: string
  bio?: string
  rating: number
  solved_count: number
  submit_count: number
  created_at: Date
  updated_at: Date
}

export interface CreateUserDTO {
  username: string
  email: string
  password: string
  role?: 'student' | 'teacher' | 'admin'
}

export interface UpdateUserDTO {
  username?: string
  email?: string
  avatar?: string
  bio?: string
}
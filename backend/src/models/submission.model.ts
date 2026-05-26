export interface Submission {
  id: number
  problem_id: number
  user_id: number
  language: string
  code: string
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error'
  runtime?: number
  memory?: number
  error_message?: string
  created_at: Date
  updated_at: Date
}

export interface CreateSubmissionDTO {
  problem_id: number
  user_id: number
  language: string
  code: string
}

export interface UpdateSubmissionDTO {
  status?: Submission['status']
  runtime?: number
  memory?: number
  error_message?: string
}
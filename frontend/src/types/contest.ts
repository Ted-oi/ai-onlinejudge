export interface Contest {
  id: number
  title: string
  description: string
  start_time: string
  end_time: string
  creator_id: number
  created_at: string
  updated_at: string
}

export interface ContestDetail extends Contest {
  problem_ids: number[]
}

export interface ContestQuery {
  status?: 'upcoming' | 'ongoing' | 'past'
  page?: number
  limit?: number
}

export interface CreateContestDTO {
  title: string
  description: string
  start_time: string
  end_time: string
  creator_id: number
  problem_ids?: number[]
}

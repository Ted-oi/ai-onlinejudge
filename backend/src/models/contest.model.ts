export interface Contest {
  id: number
  title: string
  description: string
  start_time: Date
  end_time: Date
  creator_id: number
  status: 'upcoming' | 'ongoing' | 'past'
  created_at: Date
  updated_at: Date
}

export interface CreateContestDTO {
  title: string
  description: string
  start_time: Date
  end_time: Date
  creator_id: number
  problem_ids?: number[]
}

export interface UpdateContestDTO {
  title?: string
  description?: string
  start_time?: Date
  end_time?: Date
}
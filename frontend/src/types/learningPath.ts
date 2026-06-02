export interface LearningPath {
  id: number
  title: string
  description: string
  category: string
  cover_color: string
  estimated_hours?: number
  stage_count?: number
  problem_count?: number
  is_enrolled?: boolean
  is_completed?: boolean
  progress?: { total_problems: number; solved_problems: number; percentage: number }
  created_at: string
}

export interface LearningPathStage {
  id: number
  order_index: number
  title: string
  description: string
  required_solved: number
  problems: StageProblem[]
}

export interface StageProblem {
  problem_id: number
  title: string
  difficulty: string
  category: string
  is_required: boolean
  is_solved: boolean
  order_index: number
}

export interface PathProgress {
  total_problems: number
  solved_problems: number
  percentage: number
}

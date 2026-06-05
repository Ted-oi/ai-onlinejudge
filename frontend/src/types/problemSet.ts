export interface ProblemSet {
  id: number
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  cover_color: string
  problem_ids: number[]
  creator_id: number
  creator_name?: string
  is_published: boolean
  problem_count?: number
  solved_count?: number
  progress?: number
  created_at: string
  updated_at: string
}

export interface ProblemSetDetail {
  problemSet: ProblemSet
  problems: ProblemSetProblem[]
  solvedProblemIds: number[]
  progress: {
    solved_count: number
    total_count: number
    percentage: number
  }
}

export interface ProblemSetProblem {
  id: number
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  problem_no?: string
}

export const PROBLEM_SET_CATEGORIES = [
  { value: 'dynamic_programming', label: '动态规划' },
  { value: 'greedy', label: '贪心算法' },
  { value: 'graph', label: '图论' },
  { value: 'data_structure', label: '数据结构' },
  { value: 'search', label: '搜索' },
  { value: 'math', label: '数学' },
  { value: 'string', label: '字符串' },
  { value: 'sort', label: '排序' },
  { value: 'io', label: '语法基础' },
  { value: 'other', label: '综合' },
]

export interface Team {
  id: number
  name: string
  description?: string
  avatar?: string
  team_type: 'team' | 'class'
  leader_id: number
  leader_name?: string
  invite_code?: string
  max_members: number
  is_public: boolean
  member_count?: number
  my_role?: 'leader' | 'co_leader' | 'member' | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: number
  username: string
  avatar?: string
  role: 'leader' | 'co_leader' | 'member'
  rating: number
  solved_count: number
  joined_at: string
}

export interface TeamStats {
  total_solved: number
  total_submissions: number
  category_breakdown: Record<string, number>
  active_members: number
  member_count: number
}

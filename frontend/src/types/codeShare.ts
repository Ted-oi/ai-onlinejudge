export interface SharedCode {
  id: number
  user_id: number
  problem_id?: number
  submission_id?: number
  title: string
  description?: string
  code: string
  language: string
  tags: string[]
  is_public: boolean
  pin_count: number
  like_count: number
  comment_count: number
  views: number
  isLiked?: boolean
  isPinned?: boolean
  author_name?: string
  author_avatar?: string
  problem_title?: string
  created_at: string
  updated_at: string
}

export interface SharedCodeComment {
  id: number
  shared_code_id: number
  user_id: number
  parent_id?: number
  content: string
  username?: string
  avatar?: string
  replies?: SharedCodeComment[]
  created_at: string
  updated_at: string
}

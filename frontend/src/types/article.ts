export interface Article {
  id: number
  type: 'blog' | 'solution'
  title: string
  content: string
  summary?: string
  tags: string[]
  problem_id?: number
  problem_title?: string
  author_id: number
  author_name?: string
  author_avatar?: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason?: string
  reviewer_id?: number
  reviewed_at?: string
  views: number
  like_count: number
  favorite_count: number
  comment_count: number
  is_pinned: boolean
  isLiked?: boolean
  isFavorited?: boolean
  created_at: string
  updated_at: string
}

export interface ArticleComment {
  id: number
  article_id: number
  user_id: number
  parent_id?: number
  content: string
  username?: string
  avatar?: string
  replies?: ArticleComment[]
  created_at: string
  updated_at: string
}

export interface ArticleQuery {
  type?: 'blog' | 'solution'
  tags?: string
  search?: string
  problem_id?: number
  author_id?: number
  status?: string
  page?: number
  limit?: number
  sort?: 'newest' | 'most_liked' | 'most_viewed'
}

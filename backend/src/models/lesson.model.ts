export interface Lesson {
  id: number
  course_id: number
  title: string
  description: string
  knowledge_point: string
  order_index: number
  duration?: number
  created_at: Date
  updated_at: Date
}

export interface CreateLessonDTO {
  course_id: number
  title: string
  description: string
  knowledge_point: string
  order_index?: number
  duration?: number
}

export interface UpdateLessonDTO {
  title?: string
  description?: string
  knowledge_point?: string
  order_index?: number
  duration?: number
}

export interface CourseMaterial {
  id: number
  course_id: number
  lesson_id?: number
  title: string
  type: 'ppt' | 'video' | 'document' | 'image'
  content?: string
  file_url?: string
  file_size?: number
  file_name?: string
  mime_type?: string
  order_index: number
  created_at: Date
}

export interface CreateMaterialDTO {
  course_id: number
  lesson_id?: number
  title: string
  type: 'ppt' | 'video' | 'document' | 'image'
  content?: string
  file_url?: string
  file_size?: number
  file_name?: string
  mime_type?: string
  order_index?: number
}

export interface LessonProgress {
  id: number
  user_id: number
  lesson_id: number
  completed: boolean
  completed_at?: Date
  last_position?: number
  created_at: Date
  updated_at: Date
}
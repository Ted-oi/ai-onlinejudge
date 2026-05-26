export interface Course {
  id: number
  title: string
  description: string
  category: string
  instructor_id: number
  created_at: Date
  updated_at: Date
}

export interface CreateCourseDTO {
  title: string
  description: string
  category: string
  instructor_id: number
}

export interface UpdateCourseDTO {
  title?: string
  description?: string
  category?: string
}
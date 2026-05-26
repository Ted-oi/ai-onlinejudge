// 课程相关类型定义

export interface Course {
  id: number
  title: string
  description: string
  category: string
  instructor_id: number
  lessons_count: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: number
  course_id: number
  title: string
  description: string
  knowledge_point: string  // 知识点
  order_index: number
  duration?: number  // 预计时长（分钟）
  created_at: string
  updated_at: string
}

export interface CourseMaterial {
  id: number
  course_id: number
  lesson_id?: number  // 可选，如果资源属于特定课次
  title: string
  type: 'ppt' | 'video' | 'document' | 'image'
  content?: string  // 文本内容
  file_url?: string  // 文件URL
  file_size?: number  // 文件大小（字节）
  file_name?: string  // 原始文件名
  mime_type?: string  // MIME类型
  order_index: number
  created_at: string
}

export interface LessonProgress {
  id: number
  user_id: number
  lesson_id: number
  completed: boolean
  completed_at?: string
  last_position?: number  // 视频最后播放位置（秒）
  created_at: string
  updated_at: string
}

export interface CourseProgress {
  id: number
  user_id: number
  course_id: number
  completed_lessons: number
  total_lessons: number
  started_at: string
  completed_at?: string
  created_at: string
}

export interface CreateLessonDTO {
  course_id: number
  title: string
  description: string
  knowledge_point: string
  order_index?: number
  duration?: number
}

export interface CreateMaterialDTO {
  course_id: number
  lesson_id?: number
  title: string
  type: 'ppt' | 'video' | 'document' | 'image'
  content?: string
  file?: File
  order_index?: number
}
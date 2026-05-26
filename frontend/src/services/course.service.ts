import api from './api'
import type { Course, Lesson, CourseProgress, CourseMaterial, LessonProgress } from '../types/course'

export const courseService = {
  getCourses: async (): Promise<Course[]> => {
    const response = await api.get('/courses')
    return response.data.data.courses
  },

  getCourseById: async (id: number): Promise<Course> => {
    const response = await api.get(`/courses/${id}`)
    return response.data.data.course
  },

  getCourseWithLessons: async (id: number): Promise<Course & { lessons: Lesson[] }> => {
    const response = await api.get(`/courses/${id}/details`)
    return response.data.data
  },

  getCourseProgress: async (courseId: number): Promise<CourseProgress> => {
    const response = await api.get(`/courses/${courseId}/progress`)
    return response.data.data
  },

  // 课次相关
  getLessonsByCourse: async (courseId: number): Promise<Lesson[]> => {
    const response = await api.get(`/courses/${courseId}/lessons`)
    return response.data.data.lessons
  },

  getLessonById: async (id: number): Promise<Lesson & { materials: CourseMaterial[] }> => {
    const response = await api.get(`/lessons/${id}`)
    return response.data.data
  },

  // 资源相关
  getMaterialsByCourse: async (courseId: number): Promise<CourseMaterial[]> => {
    const response = await api.get(`/courses/${courseId}/materials`)
    return response.data.data.materials
  },

  getMaterialsByLesson: async (lessonId: number): Promise<CourseMaterial[]> => {
    const response = await api.get(`/lessons/${lessonId}/materials`)
    return response.data.data.materials
  },

  createMaterial: async (data: any): Promise<CourseMaterial> => {
    const response = await api.post('/materials', data)
    return response.data.data.material
  },

  // 学习进度相关
  updateLessonProgress: async (lessonId: number, data: {
    completed?: boolean
    last_position?: number
  }): Promise<LessonProgress> => {
    const response = await api.post(`/lessons/${lessonId}/progress`, data)
    return response.data.data.progress
  },

  getLessonProgress: async (lessonId: number): Promise<LessonProgress> => {
    const response = await api.get(`/lessons/${lessonId}/progress/user/me`)
    return response.data.data
  },
}
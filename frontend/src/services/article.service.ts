import api from './api'
import type { ArticleQuery } from '../types/article'

const articleService = {
  getArticles: (params?: ArticleQuery) =>
    api.get('/articles', { params }).then(res => res.data.data),

  getArticleById: (id: number) =>
    api.get(`/articles/${id}`).then(res => res.data.data),

  getMyArticles: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/articles/my', { params }).then(res => res.data.data),

  getUserFavorites: (params?: { page?: number; limit?: number }) =>
    api.get('/articles/favorites', { params }).then(res => res.data.data),

  createArticle: (data: { type: string; title: string; content: string; summary?: string; tags?: string[]; problem_id?: number }) =>
    api.post('/articles', data).then(res => res.data.data),

  updateArticle: (id: number, data: { title?: string; content?: string; summary?: string; tags?: string[] }) =>
    api.put(`/articles/${id}`, data).then(res => res.data.data),

  deleteArticle: (id: number) =>
    api.delete(`/articles/${id}`).then(res => res.data),

  toggleLike: (id: number) =>
    api.post(`/articles/${id}/like`).then(res => res.data.data),

  toggleFavorite: (id: number) =>
    api.post(`/articles/${id}/favorite`).then(res => res.data.data),

  getComments: (articleId: number) =>
    api.get(`/articles/${articleId}/comments`).then(res => res.data.data),

  createComment: (articleId: number, data: { content: string; parent_id?: number }) =>
    api.post(`/articles/${articleId}/comments`, data).then(res => res.data.data),

  updateComment: (articleId: number, commentId: number, data: { content: string }) =>
    api.put(`/articles/${articleId}/comments/${commentId}`, data).then(res => res.data.data),

  deleteComment: (articleId: number, commentId: number) =>
    api.delete(`/articles/${articleId}/comments/${commentId}`).then(res => res.data),

  getArticleTags: () =>
    api.get('/articles/tags').then(res => res.data.data.tags),

  // Admin
  getPendingArticles: (params?: { page?: number; limit?: number }) =>
    api.get('/articles/admin/pending', { params }).then(res => res.data.data),

  reviewArticle: (id: number, data: { status: 'approved' | 'rejected'; reject_reason?: string }) =>
    api.put(`/articles/admin/${id}/review`, data).then(res => res.data.data),
}

export default articleService

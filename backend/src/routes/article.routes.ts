import { Router } from 'express'
import * as articleController from '../controllers/article.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

// Admin review routes (must be before /:id to avoid conflict)
router.get('/admin/pending', authenticate, authorize('admin', 'teacher'), articleController.getPendingArticles)
router.put('/admin/:id/review', authenticate, authorize('admin', 'teacher'), articleController.reviewArticle)

// Authenticated read routes
router.get('/tags', authenticate, articleController.getArticleTags)
router.get('/my', authenticate, articleController.getUserArticles)
router.get('/favorites', authenticate, articleController.getUserFavorites)
router.get('/', authenticate, articleController.getArticles)
router.get('/:id', authenticate, articleController.getArticleById)

// Author actions
router.post('/', authenticate, articleController.createArticle)
router.put('/:id', authenticate, articleController.updateArticle)
router.delete('/:id', authenticate, articleController.deleteArticle)

// Like / Favorite
router.post('/:id/like', authenticate, articleController.toggleLike)
router.post('/:id/favorite', authenticate, articleController.toggleFavorite)

// Comments
router.get('/:id/comments', authenticate, articleController.getComments)
router.post('/:id/comments', authenticate, articleController.createComment)
router.put('/:id/comments/:commentId', authenticate, articleController.updateComment)
router.delete('/:id/comments/:commentId', authenticate, articleController.deleteComment)

export default router

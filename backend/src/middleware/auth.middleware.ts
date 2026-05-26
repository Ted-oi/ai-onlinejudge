import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/auth.service'
import { logger } from '../utils/logger'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: '未提供认证token' }
      })
    }

    const decoded = verifyToken(token)
    ;(req as any).userId = decoded.userId
    ;(req as any).userRole = decoded.role

    next()
  } catch (error) {
    logger.error('Authentication error', error)
    res.status(401).json({
      success: false,
      error: { message: '认证失败' }
    })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { message: '权限不足' }
      })
    }

    next()
  }
}
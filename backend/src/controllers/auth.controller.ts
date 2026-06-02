import { Request, Response, NextFunction } from 'express'
import { registerUser, loginUser, getUserById } from '../services/auth.service'
import { logger } from '../utils/logger'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, role = 'student' } = req.body

    const user = await registerUser({ username, email, password, role })

    res.status(201).json({
      success: true,
      data: { user }
    })
  } catch (error: any) {
    if (error.message.includes('已存在') || error.message.includes('已被注册') || error.message.includes('重复')) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      })
    }
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account, password } = req.body

    const result = await loginUser(account, password)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    if (error.message.includes('不存在') || error.message.includes('错误')) {
      return res.status(401).json({
        success: false,
        error: { message: error.message }
      })
    }
    next(error)
  }
}

export const logout = async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '退出登录成功'
  })
}

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId

    const user = await getUserById(userId)

    res.json({
      success: true,
      data: { user }
    })
  } catch (error: any) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({
        success: false,
        error: { message: error.message }
      })
    }
    next(error)
  }
}
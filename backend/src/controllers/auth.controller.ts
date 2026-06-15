import { registerUser, loginUser, getUserById } from '../services/auth.service'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendSuccessWithMessage, sendError } from '../utils/apiResponse'

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role = 'student' } = req.body

  try {
    const user = await registerUser({ username, email, password, role })
    return sendSuccess(res, { user }, 201)
  } catch (error: any) {
    if (error.message.includes('已存在') || error.message.includes('已被注册') || error.message.includes('重复')) {
      return sendError(res, error.message, 400)
    }
    throw error
  }
})

export const login = asyncHandler(async (req, res) => {
  const { account, password } = req.body

  try {
    const result = await loginUser(account, password)
    return sendSuccess(res, result)
  } catch (error: any) {
    if (error.message.includes('不存在') || error.message.includes('错误')) {
      return sendError(res, error.message, 401)
    }
    throw error
  }
})

import type { Request, Response } from 'express'

export const logout = (_req: Request, res: Response) => {
  return sendSuccessWithMessage(res, '退出登录成功')
}

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.userId

  try {
    const user = await getUserById(userId)
    return sendSuccess(res, { user })
  } catch (error: any) {
    if (error.message.includes('不存在')) {
      return sendError(res, error.message, 404)
    }
    throw error
  }
})

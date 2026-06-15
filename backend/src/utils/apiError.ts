/**
 * Error with an attached HTTP status code. The global errorHandler renders it as
 * { success: false, error: { message } }. Throw it from controllers/services instead
 * of manually returning res.status(x).json(...).
 */
export class ApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

export const badRequest = (message = '请求参数错误') => new ApiError(400, message)
export const unauthorized = (message = '未授权') => new ApiError(401, message)
export const forbidden = (message = '禁止访问') => new ApiError(403, message)
export const notFound = (message = '资源不存在') => new ApiError(404, message)
export const conflict = (message = '资源冲突') => new ApiError(409, message)

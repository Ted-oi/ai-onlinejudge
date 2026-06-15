import { Request, Response, NextFunction } from 'express'

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown

/**
 * Wraps an async route handler so rejected promises are forwarded to Express error middleware.
 * Eliminates the repetitive try/catch/next boilerplate.
 */
export const asyncHandler = (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

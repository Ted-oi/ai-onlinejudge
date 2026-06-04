import { Request, Response, NextFunction } from 'express'
import { streamGenerateCases, parseGeneratedCases } from '../services/testgen.service'
import { logger } from '../utils/logger'

// Simple in-memory rate limiter: max 5 requests per user per minute
const rateLimitMap = new Map<number, { count: number; resetAt: number }>()

function checkRateLimit(userId: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 })
    return true
  }

  if (entry.count >= 5) {
    return false
  }

  entry.count++
  return true
}

export const generateTestCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!
    const problemId = parseInt(req.params.id)

    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        error: { message: '请求过于频繁，每分钟最多 5 次生成请求' },
      })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let fullText = ''

    for await (const chunk of streamGenerateCases(problemId)) {
      fullText += chunk
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
    }

    // Send final parsed cases
    const cases = parseGeneratedCases(fullText)
    res.write(`data: ${JSON.stringify({ done: true, cases })}\n\n`)
    res.end()
  } catch (error: any) {
    logger.error('Generate test cases error', error)
    // If headers already sent, we can't change status code
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: { message: error.message || 'AI 生成失败' },
      })
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'AI 生成失败' })}\n\n`)
      res.end()
    }
  }
}

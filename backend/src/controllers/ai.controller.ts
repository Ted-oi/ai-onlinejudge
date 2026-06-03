import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { chatService } from '../services/ai.service'

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, problem_id, message, conversation_id } = req.body

    const result = await chatService.chat(message, conversation_id || null, user_id, problem_id)

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const analyzeCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, problem_description } = req.body

    const result = await chatService.analyzeCode(code, language, problem_description)

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const getHint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problem_id, level } = req.body
    const userId = req.userId

    const problemResult = await query('SELECT title, description FROM problems WHERE id = $1', [problem_id])
    if (problemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '题目不存在' } })
    }

    const problem = problemResult.rows[0]
    const hintLevel = Math.min(Math.max(level || 1, 1), 3)

    const previousHints = await query(
      `SELECT content FROM ai_messages
       WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = $1 AND problem_id = $2)
       AND type = 'hint' AND role = 'assistant'
       ORDER BY created_at ASC`,
      [userId, problem_id]
    )
    const hints = previousHints.rows.map((r: any) => r.content)

    const result = await chatService.getHint(
      problem.title, problem.description, hintLevel, hints
    )

    let conversationId: number
    const convResult = await query(
      'SELECT id FROM ai_conversations WHERE user_id = $1 AND problem_id = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, problem_id]
    )
    if (convResult.rows.length > 0) {
      conversationId = convResult.rows[0].id
    } else {
      const newConv = await query(
        'INSERT INTO ai_conversations (user_id, problem_id) VALUES ($1, $2) RETURNING id',
        [userId, problem_id]
      )
      conversationId = newConv.rows[0].id
    }

    await query(
      "INSERT INTO ai_messages (conversation_id, role, content, type) VALUES ($1, 'user', $2, 'hint')",
      [conversationId, `请求第 ${hintLevel} 级提示`]
    )
    await query(
      "INSERT INTO ai_messages (conversation_id, role, content, type) VALUES ($1, 'assistant', $2, 'hint')",
      [conversationId, result.hint]
    )

    res.json({ success: true, data: { hint: result.hint, level: hintLevel } })
  } catch (error) {
    next(error)
  }
}

export const explainError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submission_id } = req.body

    const submissionResult = await query('SELECT * FROM submissions WHERE id = $1', [submission_id])
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '提交不存在' } })
    }

    const submission = submissionResult.rows[0]

    const problemResult = await query('SELECT title FROM problems WHERE id = $1', [submission.problem_id])
    const problemTitle = problemResult.rows[0]?.title || '未知题目'

    const result = await chatService.explainError(
      submission.code, submission.language, submission.status,
      submission.error_message, problemTitle
    )

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId

    const result = await chatService.getRecommendations(userId)

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    const result = await query(
      `SELECT c.*, p.title as problem_title
       FROM ai_conversations c
       LEFT JOIN problems p ON c.problem_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    )

    res.json({ success: true, data: { conversations: result.rows } })
  } catch (error) {
    next(error)
  }
}

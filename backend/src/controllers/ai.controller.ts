import { Request, Response, NextFunction } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { query } from '../config/database'
import { logger } from '../utils/logger'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, problem_id, message } = req.body

    let conversationId = req.body.conversation_id

    if (!conversationId) {
      const convResult = await query(
        `INSERT INTO ai_conversations (user_id, problem_id)
         VALUES ($1, $2)
         RETURNING id`,
        [user_id, problem_id]
      )
      conversationId = convResult.rows[0].id
    }

    await query(
      `INSERT INTO ai_messages (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [conversationId, message]
    )

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: message }
      ]
    })

    const aiMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    await query(
      `INSERT INTO ai_messages (conversation_id, role, content)
       VALUES ($1, 'assistant', $2)`,
      [conversationId, aiMessage]
    )

    res.json({
      success: true,
      data: {
        conversation_id: conversationId,
        message: aiMessage
      }
    })
  } catch (error) {
    next(error)
  }
}

export const analyzeCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, problem_description } = req.body

    const prompt = `请分析以下${language}代码，该代码用于解决以下问题：

问题描述：${problem_description}

代码：
\`\`\`${language}
${code}
\`\`\`

请提供：
1. 代码的正确性分析
2. 时间复杂度和空间复杂度
3. 可能的优化建议
4. 潜在的bug和改进点`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ]
    })

    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''

    res.json({
      success: true,
      data: { analysis }
    })
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

    res.json({
      success: true,
      data: { conversations: result.rows }
    })
  } catch (error) {
    next(error)
  }
}
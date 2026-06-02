import axios from 'axios'
import { query } from '../config/database'
import { logger } from '../utils/logger'

const GLM_API_URL = process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const GLM_API_KEY = process.env.GLM_API_KEY || ''
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4-flash'

async function callAI(prompt: string, maxTokens = 2048): Promise<string> {
  if (!GLM_API_KEY) {
    throw new Error('AI 服务未配置，请在 .env 中设置 GLM_API_KEY')
  }

  const response = await axios.post(
    GLM_API_URL,
    {
      model: GLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      timeout: 30000,
    }
  )

  return response.data?.choices?.[0]?.message?.content || ''
}

export const chatService = {
  async chat(message: string, conversationId: number | null, userId: number, problemId?: number) {
    if (!conversationId) {
      const convResult = await query(
        'INSERT INTO ai_conversations (user_id, problem_id) VALUES ($1, $2) RETURNING id',
        [userId, problemId || null]
      )
      conversationId = convResult.rows[0].id
    }

    await query(
      "INSERT INTO ai_messages (conversation_id, role, content, type) VALUES ($1, 'user', $2, 'chat')",
      [conversationId, message]
    )

    const aiMessage = await callAI(message)

    await query(
      "INSERT INTO ai_messages (conversation_id, role, content, type) VALUES ($1, 'assistant', $2, 'chat')",
      [conversationId, aiMessage]
    )

    return { conversation_id: conversationId, message: aiMessage }
  },

  async analyzeCode(code: string, language: string, problemDescription: string) {
    const prompt = `你是一位资深的算法竞赛教练。请分析以下 ${language} 代码，该代码用于解决给定问题。

问题描述：
${problemDescription}

代码：
\`\`\`${language}
${code}
\`\`\`

请按以下结构给出分析（使用中文）：

## 正确性分析
分析代码逻辑是否正确，是否处理了所有边界情况。

## 复杂度分析
- 时间复杂度：O(?)
- 空间复杂度：O(?)

## 优化建议
如果代码可以优化，给出具体的优化方案和优化后的代码片段。

## 代码风格
指出代码风格上的改进建议（变量命名、代码结构等）。

## 潜在问题
列出可能的 bug 或边界情况遗漏。`

    const analysis = await callAI(prompt, 2048)
    return { analysis }
  },

  async getHint(problemTitle: string, problemDescription: string, level: number, previousHints: string[]) {
    const levelDescriptions = [
      '给出一个非常宽泛的提示，只指出解题的大方向，不要透露具体算法或数据结构。',
      '给出一个中等程度的提示，指出适合的算法类别或数据结构方向，但不要给出完整思路。',
      '给出一个比较具体的提示，描述具体的解题思路和关键步骤，但不要直接给出代码。'
    ]

    const contextLine = previousHints.length > 0
      ? `\n\n之前已给出的提示：\n${previousHints.map((h, i) => `提示 ${i + 1}：${h}`).join('\n')}`
      : ''

    const prompt = `你是一位耐心的信息学竞赛辅导老师。一个学生正在做这道题但卡住了，请给他/她第 ${level} 级提示。

题目：${problemTitle}

题目描述：
${problemDescription}
${contextLine}

要求：${levelDescriptions[level - 1]}

请直接给出提示内容（不要包含"提示X"这样的标题，只给出提示正文）。`

    const hint = await callAI(prompt, 1024)
    return { hint }
  },

  async explainError(code: string, language: string, status: string, errorMessage: string | null, problemTitle: string) {
    const statusMap: Record<string, string> = {
      wrong_answer: '答案错误 (Wrong Answer)',
      time_limit_exceeded: '超时 (Time Limit Exceeded)',
      memory_limit_exceeded: '内存超限 (Memory Limit Exceeded)',
      runtime_error: '运行时错误 (Runtime Error)',
      compilation_error: '编译错误 (Compilation Error)',
      system_error: '系统错误 (System Error)',
    }

    const errorDesc = statusMap[status] || status
    const errorInfo = errorMessage ? `\n错误信息：\n\`\`\`\n${errorMessage}\n\`\`\`` : ''

    const prompt = `你是一位信息学竞赛辅导老师。学生的代码提交后收到了 "${errorDesc}" 的评测结果。

题目：${problemTitle}
语言：${language}
${errorInfo}

学生代码：
\`\`\`${language}
${code}
\`\`\`

请帮助学生理解：
1. **错误原因**：这个评测结果意味着什么？可能是什么导致的？
2. **问题定位**：代码中哪个部分最可能有问题？
3. **修复建议**：给出修改方向（不要直接给出完整正确代码，引导学生思考）

请用中文回答，语言简洁易懂。`

    const explanation = await callAI(prompt, 2048)
    return { explanation }
  },

  async getRecommendations(userId: number) {
    const skills = await query(
      'SELECT category, solved_count, attempt_count FROM user_skills WHERE user_id = $1',
      [userId]
    )

    const solvedProblemIds = await query(
      "SELECT DISTINCT problem_id FROM submissions WHERE user_id = $1 AND status = 'accepted'",
      [userId]
    )
    const solvedIds = solvedProblemIds.rows.map((r: any) => r.problem_id)

    const weakCategories = skills.rows
      .filter((s: any) => s.attempt_count > 0 && s.solved_count / s.attempt_count < 0.5)
      .map((s: any) => s.category)

    let recommendedProblems: any[] = []

    if (weakCategories.length > 0) {
      const result = await query(
        `SELECT id, title, difficulty, category FROM problems
         WHERE category = ANY($1) AND difficulty IN ('easy', 'medium')
         ${solvedIds.length > 0 ? 'AND id != ALL($2)' : ''}
         ORDER BY RANDOM() LIMIT 5`,
        solvedIds.length > 0 ? [weakCategories, solvedIds] : [weakCategories]
      )
      recommendedProblems = result.rows
    }

    if (recommendedProblems.length < 5) {
      const existing = recommendedProblems.map((p: any) => p.id)
      const params: any[] = []
      let conditions = "WHERE difficulty = 'easy'"

      if (existing.length > 0) {
        params.push(existing)
        conditions += ` AND id != ALL($${params.length})`
      }
      if (solvedIds.length > 0) {
        params.push(solvedIds)
        conditions += ` AND id != ALL($${params.length})`
      }
      params.push(5 - recommendedProblems.length)
      conditions += ` ORDER BY RANDOM() LIMIT $${params.length}`

      const result = await query(`SELECT id, title, difficulty, category FROM problems ${conditions}`, params)
      recommendedProblems = [...recommendedProblems, ...result.rows]
    }

    return {
      recommendations: recommendedProblems.slice(0, 5),
      weak_categories: weakCategories
    }
  }
}

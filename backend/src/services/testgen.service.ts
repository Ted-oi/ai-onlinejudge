import axios from 'axios'
import { query } from '../config/database'
import { logger } from '../utils/logger'

const GLM_API_URL = process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const GLM_API_KEY = process.env.GLM_API_KEY || ''
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4-flash'

interface GeneratedCase {
  input: string
  output: string
  description: string
}

export function buildPrompt(
  title: string,
  description: string,
  difficulty: string,
  timeLimit: number,
  memoryLimit: number,
  existingCases: Array<{ input: string; output: string }>
): string {
  const existingDesc = existingCases.length > 0
    ? `\n已有测试用例（避免重复这些模式）：\n${existingCases.slice(0, 5).map((c, i) => `用例${i + 1}: 输入=${c.input.substring(0, 100)}... 输出=${c.output.substring(0, 50)}...`).join('\n')}`
    : ''

  return `你是一个算法竞赛测试数据生成器。请为以下题目生成 5-8 个测试用例。

题目：${title}
描述：${description}
难度：${difficulty}
时间限制：${timeLimit}ms，内存限制：${memoryLimit}MB
${existingDesc}

请生成以下类型的测试用例：
1. 边界情况（最大/最小输入、极端值）
2. 特殊情况（空输入、单元素、重复元素等）
3. 随机中等规模用例
4. 可能导致错误答案的陷阱用例

每个测试用例请严格按照以下格式输出：
===INPUT===
[输入数据]
===OUTPUT===
[期望输出]
===DESC===
[简短描述这是什么类型的测试]
===END===

注意：
- 输入输出必须严格符合题目要求的格式
- 输出必须是精确的正确答案，不要有多余空格或换行
- 对于大数据量用例，数据规模要合理（不要超过题目限制）`
}

export function parseGeneratedCases(text: string): GeneratedCase[] {
  const cases: GeneratedCase[] = []
  const blocks = text.split('===END===').filter(b => b.trim())

  for (const block of blocks) {
    const inputMatch = block.match(/===INPUT===\s*([\s\S]*?)\s*===OUTPUT===/)
    const outputMatch = block.match(/===OUTPUT===\s*([\s\S]*?)\s*===DESC===/)
    const descMatch = block.match(/===DESC===\s*([\s\S]*?)$/)

    if (inputMatch && outputMatch) {
      cases.push({
        input: inputMatch[1].trim(),
        output: outputMatch[1].trim(),
        description: descMatch ? descMatch[1].trim() : '',
      })
    }
  }

  return cases
}

export async function* streamGenerateCases(
  problemId: number
): AsyncGenerator<string> {
  if (!GLM_API_KEY) {
    throw new Error('AI 服务未配置')
  }

  const problemResult = await query(
    'SELECT title, description, difficulty, time_limit, memory_limit FROM problems WHERE id = $1',
    [problemId]
  )
  if (problemResult.rows.length === 0) {
    throw new Error('题目不存在')
  }
  const problem = problemResult.rows[0]

  const existingCases = await query(
    'SELECT input, output FROM test_cases WHERE problem_id = $1 ORDER BY id LIMIT 10',
    [problemId]
  )

  const prompt = buildPrompt(
    problem.title,
    problem.description?.substring(0, 2000) || '',
    problem.difficulty,
    problem.time_limit || 1000,
    problem.memory_limit || 256,
    existingCases.rows
  )

  const response = await axios.post(
    GLM_API_URL,
    {
      model: GLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      timeout: 60000,
      responseType: 'stream',
    }
  )

  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n').filter((l: string) => l.startsWith('data: '))
    for (const line of lines) {
      const data = line.substring(6).trim()
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) yield content
      } catch {
        // skip malformed chunks
      }
    }
  }
}

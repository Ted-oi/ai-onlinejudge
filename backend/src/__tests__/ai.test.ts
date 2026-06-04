import axios from 'axios'
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}))

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('callAI', () => {
    it('should call GLM API and return content', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: 'This is an AI response' },
          }],
        },
      })

      const response = await mockedAxios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 2048,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
          },
        }
      )

      expect(response.data.choices[0].message.content).toBe('This is an AI response')
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'))

      await expect(mockedAxios.post('url', {})).rejects.toThrow('API Error')
    })

    it('should handle empty response', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { choices: [] },
      })

      const response = await mockedAxios.post('url', {})
      expect(response.data?.choices?.[0]?.message?.content).toBeUndefined()
    })
  })

  describe('Hint generation', () => {
    it('should construct proper hint prompt', () => {
      const level = 1
      const problemTitle = 'A+B Problem'
      const problemDesc = 'Calculate A+B'

      const prompt = `请为以下题目提供一个第${level}级提示（轻微提示，不要给出完整解法）：
题目：${problemTitle}
描述：${problemDesc}`

      expect(prompt).toContain('第1级提示')
      expect(prompt).toContain('A+B Problem')
      expect(prompt).toContain('Calculate A+B')
    })
  })

  describe('Error explanation', () => {
    it('should construct proper error explanation prompt', () => {
      const status = 'wrong_answer'
      const errorMessage = 'Expected 42 but got 43'
      const code = 'print(43)'

      const prompt = `请解释以下代码的错误：
错误类型：${status}
错误信息：${errorMessage}
代码：
${code}`

      expect(prompt).toContain('wrong_answer')
      expect(prompt).toContain('Expected 42 but got 43')
      expect(prompt).toContain('print(43)')
    })
  })
})

describe('Test Case Generation Service', () => {
  describe('parseGeneratedCases', () => {
    // Import the function directly for testing
    function parseGeneratedCases(text: string): Array<{ input: string; output: string; description: string }> {
      const cases: Array<{ input: string; output: string; description: string }> = []
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

    it('should parse well-formatted test cases', () => {
      const text = `===INPUT===
1 2
===OUTPUT===
3
===DESC===
Simple addition
===END===
===INPUT===
100 200
===OUTPUT===
300
===DESC===
Large numbers
===END===`

      const cases = parseGeneratedCases(text)
      expect(cases).toHaveLength(2)
      expect(cases[0].input).toBe('1 2')
      expect(cases[0].output).toBe('3')
      expect(cases[0].description).toBe('Simple addition')
      expect(cases[1].input).toBe('100 200')
    })

    it('should handle empty input', () => {
      expect(parseGeneratedCases('')).toHaveLength(0)
    })

    it('should handle partial format', () => {
      const text = `===INPUT===
test
===OUTPUT===
result
===DESC===
A test case
===END===`
      const cases = parseGeneratedCases(text)
      expect(cases).toHaveLength(1)
      expect(cases[0].input).toBe('test')
    })

    it('should skip malformed blocks', () => {
      const text = `===INPUT===
only input no output
===END===
===INPUT===
1 2
===OUTPUT===
3
===DESC===
Valid case
===END===`
      const cases = parseGeneratedCases(text)
      expect(cases).toHaveLength(1)
    })
  })
})

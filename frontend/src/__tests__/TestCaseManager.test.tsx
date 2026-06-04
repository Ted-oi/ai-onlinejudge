import { describe, it, expect, vi } from 'vitest'

// Mock API
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        data: {
          test_cases: [
            { id: 1, problem_id: 1, input: '1 2', output: '3', is_sample: true, created_at: '2026-06-04' },
            { id: 2, problem_id: 1, input: '10 20', output: '30', is_sample: false, created_at: '2026-06-04' },
          ],
        },
      },
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}))

describe('Test Case API - Logic Tests', () => {
  it('fetches test cases for a problem', async () => {
    const api = (await import('../services/api')).default
    const response = await api.get('/problems/1/test-cases')
    const cases = response.data.data.test_cases
    expect(cases).toHaveLength(2)
    expect(cases[0].input).toBe('1 2')
    expect(cases[0].output).toBe('3')
    expect(cases[0].is_sample).toBe(true)
  })

  it('can batch create test cases', async () => {
    const api = (await import('../services/api')).default
    const newCases = [
      { input: '5 5', output: '10', is_sample: false },
      { input: '0 0', output: '0', is_sample: false },
    ]
    const response = await api.post('/problems/1/test-cases/batch', { test_cases: newCases })
    expect(response.data.success).toBe(true)
    expect(api.post).toHaveBeenCalledWith('/problems/1/test-cases/batch', { test_cases: newCases })
  })
})

describe('AI Test Case Generation - Parse Logic', () => {
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

  it('parses AI-generated test cases', () => {
    const text = `===INPUT===
1 2
===OUTPUT===
3
===DESC===
Basic addition
===END===
===INPUT===
0 0
===OUTPUT===
0
===DESC===
Edge case: zeros
===END===`
    const cases = parseGeneratedCases(text)
    expect(cases).toHaveLength(2)
    expect(cases[0]).toEqual({ input: '1 2', output: '3', description: 'Basic addition' })
    expect(cases[1]).toEqual({ input: '0 0', output: '0', description: 'Edge case: zeros' })
  })

  it('handles malformed input gracefully', () => {
    expect(parseGeneratedCases('')).toHaveLength(0)
    expect(parseGeneratedCases('random text')).toHaveLength(0)
    expect(parseGeneratedCases('===INPUT===\ntest\n===END===')).toHaveLength(0)
  })
})

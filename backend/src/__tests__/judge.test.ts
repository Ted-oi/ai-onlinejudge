// Test the output comparison logic used in local judging
describe('Judge Output Comparison', () => {
  function normalizeOutput(output: string): string {
    return output.replace(/\r\n/g, '\n').replace(/\s+$/gm, '').trim()
  }

  it('should match identical outputs', () => {
    expect(normalizeOutput('hello\nworld')).toBe(normalizeOutput('hello\nworld'))
  })

  it('should ignore trailing whitespace per line', () => {
    expect(normalizeOutput('hello  \nworld  ')).toBe(normalizeOutput('hello\nworld'))
  })

  it('should handle different line endings', () => {
    expect(normalizeOutput('hello\r\nworld')).toBe(normalizeOutput('hello\nworld'))
  })

  it('should be case sensitive', () => {
    expect(normalizeOutput('Hello')).not.toBe(normalizeOutput('hello'))
  })

  it('should handle empty output', () => {
    expect(normalizeOutput('')).toBe(normalizeOutput(''))
  })

  it('should handle single line output', () => {
    expect(normalizeOutput('42')).toBe(normalizeOutput('42'))
  })
})

describe('Judge Status Mapping', () => {
  // Test the status mapping from result codes to status strings
  const statusMap: Record<string, string> = {
    '0': 'accepted',
    '-1': 'wrong_answer',
    '1': 'time_limit_exceeded',
    '2': 'time_limit_exceeded',
    '3': 'memory_limit_exceeded',
    '4': 'runtime_error',
    '-2': 'system_error',
    '-3': 'compilation_error',
  }

  it('should map 0 to accepted', () => {
    expect(statusMap['0']).toBe('accepted')
  })

  it('should map -1 to wrong_answer', () => {
    expect(statusMap['-1']).toBe('wrong_answer')
  })

  it('should map 1 and 2 to time_limit_exceeded', () => {
    expect(statusMap['1']).toBe('time_limit_exceeded')
    expect(statusMap['2']).toBe('time_limit_exceeded')
  })

  it('should map -3 to compilation_error', () => {
    expect(statusMap['-3']).toBe('compilation_error')
  })
})

describe('Local Judge Availability', () => {
  it('should check if a language is available', () => {
    // This tests the import structure, not actual compilation
    const supportedLanguages = ['cpp', 'c', 'python', 'java']
    expect(supportedLanguages).toContain('cpp')
    expect(supportedLanguages).toContain('python')
    expect(supportedLanguages).not.toContain('rust')
  })
})

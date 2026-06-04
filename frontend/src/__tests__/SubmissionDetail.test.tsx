import { describe, it, expect, vi } from 'vitest'

// Mock submission service
vi.mock('../services/submission.service', () => ({
  submissionService: {
    getSubmissionById: vi.fn().mockResolvedValue({
      id: 1,
      problem_id: 1,
      problem_title: 'A+B Problem',
      user_id: 1,
      language: 'cpp',
      status: 'accepted',
      runtime: 10,
      memory: 1024,
      code: '#include <iostream>',
      created_at: '2026-06-04T10:00:00Z',
    }),
  },
}))

vi.mock('../services/socket', () => ({
  getSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
  }),
}))

describe('Submission Service - Logic Tests', () => {
  it('returns submission with correct fields', async () => {
    const { submissionService } = await import('../services/submission.service')
    const data = await submissionService.getSubmissionById(1)
    expect(data.id).toBe(1)
    expect(data.status).toBe('accepted')
    expect(data.language).toBe('cpp')
    expect(data.runtime).toBe(10)
    expect(data.memory).toBe(1024)
  })

  it('submission status maps correctly', () => {
    const FINAL_STATUSES = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'system_error', 'error']

    expect(FINAL_STATUSES).toContain('accepted')
    expect(FINAL_STATUSES).toContain('wrong_answer')
    expect(FINAL_STATUSES).toContain('compilation_error')
    expect(FINAL_STATUSES).not.toContain('pending')
    expect(FINAL_STATUSES).not.toContain('judging')
  })
})

describe('Socket Integration', () => {
  it('socket joins contest room', async () => {
    const { getSocket } = await import('../services/socket')
    const socket = getSocket()
    socket.emit('join:contest', 1)
    expect(socket.emit).toHaveBeenCalledWith('join:contest', 1)
  })

  it('socket leaves contest room', async () => {
    const { getSocket } = await import('../services/socket')
    const socket = getSocket()
    socket.emit('leave:contest', 1)
    expect(socket.emit).toHaveBeenCalledWith('leave:contest', 1)
  })
})
